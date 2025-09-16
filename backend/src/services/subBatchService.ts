// src/services/subBatchService.ts
import prisma, { Prisma, workflow_steps } from "../config/db";
import {
  SubBatchPayload,
  SubBatchPayloadWithArrays,
} from "../types/subBatchTypes";



export enum DepartmentStage {
  NEW_ARRIVAL = "NEW_ARRIVAL",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}




export const createSubBatch = async (data: SubBatchPayload) => {
  // Validation
  if (!data.name.trim()) throw { message: "Name is required" };
  if (data.estimatedPieces <= 0 || data.expectedItems <= 0)
    throw { message: "Estimated and expected items must be positive" };
  if (new Date(data.startDate) > new Date(data.dueDate))
    throw { message: "Start date cannot be after due date" };

  // Create main sub_batch row
  const subBatch = await prisma.sub_batches.create({
    data: {
      name: data.name,
      estimated_pieces: data.estimatedPieces,
      expected_items: data.expectedItems,
      start_date: new Date(data.startDate),
      due_date: new Date(data.dueDate),
      roll_id: data.rollId,
      batch_id: data.batchId,
      department_id: data.departmentId,
      // Optional: attachments nested
      ...(data.attachments?.length
        ? {
            attachments: {
              create: data.attachments.map((a) => ({
                attachment_name: a.attachmentName,
                quantity: a.quantity,
              })),
            },
          }
        : {}),
    },
  });

  // Insert size details separately
  if (data.sizeDetails?.length) {
    for (const sd of data.sizeDetails) {
      await prisma.sub_batch_size_details.create({
        data: {
          sub_batch_id: subBatch.id,
          category: sd.category,
          pieces: sd.pieces,
        },
      });
    }
  }

  return { message: "Sub-batch created successfully", subBatch };
};

// Get all Sub-Batches
export const getAllSubBatches = async () => {
  return await prisma.sub_batches.findMany({
    include: { size_details: true, attachments: true },
  });
};

// Get Sub-Batch by ID
export const getSubBatchById = async (id: number) => {
  const subBatch = await prisma.sub_batches.findUnique({
    where: { id },
    include: { size_details: true, attachments: true },
  });
  if (!subBatch) throw { message: "Sub-batch not found" };
  return subBatch;
};

export const updateSubBatch = async (
  id: number,
  data: Partial<SubBatchPayloadWithArrays>
) => {
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.estimatedPieces !== undefined)
    updateData.estimated_pieces = data.estimatedPieces;
  if (data.expectedItems !== undefined)
    updateData.expected_items = data.expectedItems;
  if (data.startDate !== undefined)
    updateData.start_date = new Date(data.startDate);
  if (data.dueDate !== undefined) updateData.due_date = new Date(data.dueDate);
  if (data.rollId !== undefined) updateData.roll_id = data.rollId;
  if (data.batchId !== undefined) updateData.batch_id = data.batchId;
  if (data.departmentId !== undefined)
    updateData.department_id = data.departmentId;

  // Update main sub_batch row
  const subBatch = await prisma.sub_batches.update({
    where: { id },
    data: updateData,
    include: { attachments: true }, // optional: include attachments
  });

  // Update size details separately
  if (data.sizeDetails !== undefined) {
    // Optionally: delete old size details
    await prisma.sub_batch_size_details.deleteMany({
      where: { sub_batch_id: id },
    });

    for (const sd of data.sizeDetails) {
      await prisma.sub_batch_size_details.create({
        data: {
          sub_batch_id: id,
          category: sd.category,
          pieces: sd.pieces,
        },
      });
    }
  }

  // Optional: update attachments if needed
  if (data.attachments !== undefined) {
    await prisma.sub_batch_attachments.deleteMany({
      where: { sub_batch_id: id },
    });

    if (data.attachments.length) {
      for (const a of data.attachments) {
        await prisma.sub_batch_attachments.create({
          data: {
            sub_batch_id: id,
            attachment_name: a.attachmentName,
            quantity: a.quantity,
          },
        });
      }
    }
  }

  return { message: "Sub-batch updated successfully", subBatch };
};
// Delete Sub-Batch
export const deleteSubBatch = async (id: number) => {
  const deleted = await prisma.sub_batches.delete({
    where: { id },
    include: { size_details: true, attachments: true },
  });
  return { message: "Sub-batch deleted successfully", subBatch: deleted };
};








// Send Sub-Batch to Production (template or manual)


interface RejectedOrAlteredPiece {
  quantity: number;
  targetDepartmentId: number;
  reason: string;
}





interface RejectedOrAlteredPiece {
  quantity: number;
  targetDepartmentId: number;
  reason: string;
}

// Send Sub-Batch to Production (manual departments only)


export async function sendToProduction(
  subBatchId: number,
  manualDepartments: number[] // array of department IDs in order
) {
  if (!manualDepartments || manualDepartments.length === 0) {
    throw new Error("At least one department must be provided");
  }

  // Fetch sub-batch to get estimated pieces
  const subBatch = await prisma.sub_batches.findUnique({
    where: { id: subBatchId },
  });
  if (!subBatch) throw new Error("Sub-batch not found");

  // Prepare steps
  const steps = manualDepartments.map((deptId, index) => ({
    step_index: index,
    department_id: deptId,
  }));

  // Create sub-batch workflow
  const workflow = await prisma.sub_batch_workflows.create({
    data: {
      sub_batch_id: subBatchId,
      current_step_index: 0,
      steps: { create: steps },
    },
    include: { steps: true },
  });

  // Send to first department (New Arrival)
  const firstDeptId = manualDepartments[0];
  await prisma.department_sub_batches.create({
    data: {
      sub_batch_id: subBatchId,
      department_id: firstDeptId,
      stage: DepartmentStage.NEW_ARRIVAL,
      is_current: true,
      quantity_remaining: subBatch.estimated_pieces, // automatically filled
    },
  });

  return workflow;
}




// Move stage within Kanban
export async function moveSubBatchStage(
  departmentSubBatchId: number,
  toStage: DepartmentStage
) {
  // 1️⃣ Get current record
  const dsb = await prisma.department_sub_batches.findUnique({
    where: { id: departmentSubBatchId },
  });

  if (!dsb) throw new Error("Department sub-batch not found");

  const fromStage = dsb.stage;

  // 2️⃣ Update stage
  const updatedDSB = await prisma.department_sub_batches.update({
    where: { id: departmentSubBatchId },
    data: { stage: toStage },
  });

  // 3️⃣ Log history
  await prisma.department_sub_batch_history.create({
    data: {
      department_sub_batch_id: departmentSubBatchId,
      sub_batch_id: dsb.sub_batch_id!,
      from_stage: fromStage,
      to_stage: toStage,
    },
  });

  return updatedDSB;
}


export async function advanceSubBatchToNextDepartment(subBatchId: number) {
  // 1️⃣ Get workflow with steps
  const workflow = await prisma.sub_batch_workflows.findUnique({
    where: { sub_batch_id: subBatchId },
    include: { steps: true },
  });

  if (!workflow) throw new Error("Workflow not found");

  let currentIndex = workflow.current_step_index;

  if (currentIndex + 1 >= workflow.steps.length) {
    return null; // Already at last department
  }

  const currentStep = workflow.steps[currentIndex];

  // 2️⃣ Mark current department_sub_batch as inactive
  await prisma.department_sub_batches.updateMany({
    where: {
      sub_batch_id: subBatchId,
      department_id: currentStep.department_id,
      is_current: true,
    },
    data: { is_current: false },
  });

  // 3️⃣ Advance workflow
  currentIndex += 1;
  await prisma.sub_batch_workflows.update({
    where: { sub_batch_id: subBatchId },
    data: { current_step_index: currentIndex },
  });

  const nextStep = workflow.steps[currentIndex];

  // 4️⃣ Add sub-batch to next department (New Arrival)
  return await prisma.department_sub_batches.create({
    data: {
      sub_batch_id: subBatchId,
      department_id: nextStep.department_id,
      stage: DepartmentStage.NEW_ARRIVAL,
      is_current: true,
    },
  });
}
