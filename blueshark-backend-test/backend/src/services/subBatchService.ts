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
      parent_department_sub_batch_id: null, // ✅ First Main card has no parent
      stage: DepartmentStage.NEW_ARRIVAL,
      is_current: true,
      quantity_received: subBatch.estimated_pieces, // ✅ Initial quantity received
      quantity_remaining: subBatch.estimated_pieces, // automatically filled
      total_quantity: subBatch.estimated_pieces, // total quantity that doesn't change
      remarks: "Main in this Department", // ✅ Fresh arrival in first department (use quantity_received)
    },
  });

  // ✅ Update sub-batch status to IN_PRODUCTION (first department entry created)
  await prisma.sub_batches.update({
    where: { id: subBatchId },
    data: { status: 'IN_PRODUCTION' }
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


export async function advanceSubBatchToNextDepartment(
  departmentSubBatchId: number,
  toDepartmentId: number,
  quantityBeingSent: number
) {
  // 1️⃣ Get the specific department_sub_batch entry to advance
  const currentDept = await prisma.department_sub_batches.findUnique({
    where: {
      id: departmentSubBatchId,
    },
  });

  if (!currentDept) {
    throw new Error(
      `Department sub-batch entry with id ${departmentSubBatchId} not found`
    );
  }

  if (!currentDept.is_current) {
    throw new Error(
      `Department sub-batch entry ${departmentSubBatchId} is not active`
    );
  }

  // Validate quantity being sent
  if (quantityBeingSent <= 0) {
    throw new Error("Quantity being sent must be greater than 0");
  }

  // Check against quantity_received (what arrived in this department)
  // This is the total that can be worked on and sent forward
  const availableQuantity = currentDept.quantity_received || currentDept.total_quantity || 0;

  if (quantityBeingSent > availableQuantity) {
    throw new Error(
      `Cannot send ${quantityBeingSent} pieces. Only ${availableQuantity} pieces available in this department.`
    );
  }

  // 2️⃣ Validate that the target department exists
  const targetDepartment = await prisma.departments.findUnique({
    where: { id: toDepartmentId },
  });

  if (!targetDepartment) throw new Error("Target department not found");

  // 3️⃣ Mark this specific entry as inactive and record where it was sent
  await prisma.department_sub_batches.update({
    where: {
      id: currentDept.id,
    },
    data: {
      is_current: false,
      sent_to_department_id: toDepartmentId, // ✅ Track where it was sent
    },
  });

  // 4️⃣ Create new entry in target department (this becomes the new Main card for that department)
  return await prisma.department_sub_batches.create({
    data: {
      sub_batch_id: currentDept.sub_batch_id,
      department_id: toDepartmentId,
      parent_department_sub_batch_id: null, // ✅ New Main card in new department has no parent
      stage: DepartmentStage.NEW_ARRIVAL,
      is_current: true,
      quantity_received: quantityBeingSent, // ✅ Set received quantity (constant baseline)
      quantity_remaining: quantityBeingSent, // ✅ Set remaining quantity (can change with reject/alter)
      total_quantity: currentDept.total_quantity, // Copy the original total quantity
      remarks: "Main in this Department", // ✅ Fresh arrival in new department, independent main card (use quantity_received)
      sent_from_department: currentDept.department_id, // ✅ Track which department it came from
      // ✅ Propagate alter_reason and reject_reason so rework/rejection cards maintain their identity
      alter_reason: currentDept.alter_reason, // Keeps rework cards identifiable across departments
      reject_reason: currentDept.reject_reason, // Keeps rejection cards identifiable across departments
    },
  });
}

/**
 * Mark a sub-batch as completed
 * This should be called when all work on a sub-batch is finished
 */
export async function markSubBatchAsCompleted(subBatchId: number) {
  // 1️⃣ Verify sub-batch exists
  const subBatch = await prisma.sub_batches.findUnique({
    where: { id: subBatchId },
  });

  if (!subBatch) {
    throw new Error(`Sub-batch with id ${subBatchId} not found`);
  }

  // 2️⃣ Check if already completed
  if (subBatch.status === 'COMPLETED') {
    throw new Error(`Sub-batch ${subBatchId} is already marked as completed`);
  }

  // 3️⃣ Update status to COMPLETED and set completed_at timestamp
  const updatedSubBatch = await prisma.sub_batches.update({
    where: { id: subBatchId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date(),
    },
  });

  return updatedSubBatch;
}

/**
 * Get sub-batches by status
 */
export async function getSubBatchesByStatus(status: 'DRAFT' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED') {
  return await prisma.sub_batches.findMany({
    where: { status },
    include: {
      size_details: true,
      attachments: true,
      department: true,
      workflows: {
        include: {
          steps: {
            include: {
              department: true,
            },
          },
        },
      },
    },
    orderBy: {
      start_date: 'desc',
    },
  });
}

/**
 * Get completed sub-batches with completion date
 */
export async function getCompletedSubBatches(startDate?: Date, endDate?: Date) {
  const whereClause: any = {
    status: 'COMPLETED',
    completed_at: {
      not: null,
    },
  };

  if (startDate || endDate) {
    whereClause.completed_at = {};
    if (startDate) whereClause.completed_at.gte = startDate;
    if (endDate) whereClause.completed_at.lte = endDate;
  }

  return await prisma.sub_batches.findMany({
    where: whereClause,
    include: {
      size_details: true,
      attachments: true,
      department: true,
    },
    orderBy: {
      completed_at: 'desc',
    },
  });
}

/**
 * Check sub-batch deletion eligibility based on status
 * Business Rules:
 * - DRAFT: Can delete (safe - nothing happened)
 * - IN_PRODUCTION: BLOCKED (supervisors actively working)
 * - COMPLETED: BLOCKED (contains wage data - legal/financial record)
 * - CANCELLED: BLOCKED (contains historical data)
 *
 * @param subBatchIds - Array of sub-batch IDs to check
 * @returns Object with arrays categorized by deletion eligibility
 */
export const checkSubBatchDependencies = async (subBatchIds: number[]) => {
  const inProductionSubBatches: number[] = [];    // IN_PRODUCTION - BLOCKED (red)
  const completedSubBatches: number[] = [];       // COMPLETED - BLOCKED (yellow)
  const cancelledSubBatches: number[] = [];       // CANCELLED - BLOCKED (gray)
  const draftSubBatches: number[] = [];           // DRAFT - Deleteable (green)

  for (const subBatchId of subBatchIds) {
    // Get sub-batch status
    const subBatch = await prisma.sub_batches.findUnique({
      where: { id: subBatchId },
      select: { status: true },
    });

    if (!subBatch) {
      continue; // Skip if not found
    }

    // Categorize by status
    if (subBatch.status === 'IN_PRODUCTION') {
      // ❌ BLOCKED - Active work, supervisors managing
      inProductionSubBatches.push(subBatchId);
    } else if (subBatch.status === 'COMPLETED') {
      // ❌ BLOCKED - Contains wage data (payroll records)
      completedSubBatches.push(subBatchId);
    } else if (subBatch.status === 'CANCELLED') {
      // ❌ BLOCKED - Contains historical data
      cancelledSubBatches.push(subBatchId);
    } else if (subBatch.status === 'DRAFT') {
      // ✅ DELETEABLE - Clean, can hard delete
      draftSubBatches.push(subBatchId);
    }
  }

  return {
    inProductionSubBatches,   // Red - Active work
    completedSubBatches,      // Yellow - Wage data
    cancelledSubBatches,      // Gray - Historical
    draftSubBatches,          // Green - Safe to delete
  };
};

/**
 * Delete a sub-batch and all its related records
 * Also restores quantity to parent batch
 * Cascade delete order:
 * 1. Delete all related records:
 *    - worker_logs
 *    - sub_batch_size_details
 *    - sub_batch_attachments
 *    - sub_batch_altered
 *    - sub_batch_rejected
 *    - sub_batch_workflows
 *    - department_sub_batches
 * 2. Restore quantity to parent batch (if exists)
 * 3. Delete the sub-batch
 */
export const deleteSubBatch = async (id: number) => {
  // Get sub-batch with status to apply business rules
  const subBatch = await prisma.sub_batches.findUnique({
    where: { id },
    select: {
      batch_id: true,
      estimated_pieces: true,
      status: true,
    },
  });

  if (!subBatch) {
    throw new Error("Sub-batch not found");
  }

  // ❌ BLOCK: Cannot delete IN_PRODUCTION sub-batches
  // Reason: Supervisors are actively working on these (see SUPERVISOR_USER_STORIES.md)
  if (subBatch.status === 'IN_PRODUCTION') {
    throw new Error(
      "Cannot delete sub-batches that are currently in production. " +
      "Please complete or cancel the production workflow first."
    );
  }

  // ❌ BLOCK: Cannot delete COMPLETED sub-batches
  // Reason: Contains worker logs (wage data is legal/financial record - see US-013)
  if (subBatch.status === 'COMPLETED') {
    throw new Error(
      "Cannot delete completed sub-batches. " +
      "They contain worker logs and wage calculation data which must be preserved for payroll."
    );
  }

  // ❌ BLOCK: Cannot delete CANCELLED sub-batches
  // Reason: Contains historical data that may be needed for auditing
  if (subBatch.status === 'CANCELLED') {
    throw new Error(
      "Cannot delete cancelled sub-batches. " +
      "Historical data must be preserved. Only DRAFT sub-batches can be deleted."
    );
  }

  // ✅ HARD DELETE: DRAFT sub-batches only
  // Reason: Nothing happened yet, safe to completely remove
  if (subBatch.status === 'DRAFT') {
    // Delete all related records in correct order
    // Order matters: delete child records first

    // 1. Delete worker logs
    await prisma.worker_logs.deleteMany({
      where: { sub_batch_id: id },
    });

    // 2. Delete department sub-batch history (IMPORTANT: was missing!)
    await prisma.department_sub_batch_history.deleteMany({
      where: { sub_batch_id: id },
    });

    // 3. Delete size details
    await prisma.sub_batch_size_details.deleteMany({
      where: { sub_batch_id: id },
    });

    // 4. Delete attachments
    await prisma.sub_batch_attachments.deleteMany({
      where: { sub_batch_id: id },
    });

    // 5. Delete altered records
    await prisma.sub_batch_altered.deleteMany({
      where: { sub_batch_id: id },
    });

    // 6. Delete rejected records
    await prisma.sub_batch_rejected.deleteMany({
      where: { sub_batch_id: id },
    });

    // 7. Delete workflows
    await prisma.sub_batch_workflows.deleteMany({
      where: { sub_batch_id: id },
    });

    // 8. Delete department sub-batches
    await prisma.department_sub_batches.deleteMany({
      where: { sub_batch_id: id },
    });

    // 9. Restore quantity to parent batch (material was never used)
    if (subBatch.batch_id) {
      await prisma.batches.update({
        where: { id: subBatch.batch_id },
        data: {
          quantity: {
            increment: subBatch.estimated_pieces,
          },
        },
      });
    }

    // 10. Finally, delete the sub-batch itself
    const deletedSubBatch = await prisma.sub_batches.delete({
      where: { id },
    });

    return {
      message: "Sub-batch deleted successfully and quantity restored to parent batch",
      subBatch: deletedSubBatch,
      type: "HARD_DELETE",
      quantityRestored: subBatch.estimated_pieces
    };
  }

  // Should never reach here, but safety fallback
  throw new Error(`Invalid sub-batch status: ${subBatch.status}`);
};
