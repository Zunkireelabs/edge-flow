// src/services/subBatchAltered.ts
import prisma, {
  Prisma,
  department_sub_batches,
  sub_batch_altered,
  department_sub_batch_history,
} from "../config/db";

export enum DepartmentStage {
  NEW_ARRIVAL = "NEW_ARRIVAL",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

interface AlteredPieceInput {
  sub_batch_id: number;
  quantity: number;
  target_department_id: number;
  reason: string;
}

export const createAlteredSubBatch = async (data: AlteredPieceInput) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Create altered record
    const altered = await tx.sub_batch_altered.create({
      data: {
        sub_batch_id: data.sub_batch_id,
        quantity: data.quantity,
        sent_to_department_id: data.target_department_id,
        reason: data.reason,
      },
    });

    // 2️⃣ Get original sub-batch to know estimated pieces
    const subBatch = await tx.sub_batches.findUnique({
      where: { id: data.sub_batch_id },
    });
    if (!subBatch) throw new Error("Sub-batch not found");

    // 3️⃣ Add to department_sub_batches for target department with quantity_remaining
    const deptSubBatch = await tx.department_sub_batches.create({
      data: {
        sub_batch_id: data.sub_batch_id,
        department_id: data.target_department_id,
        stage: DepartmentStage.NEW_ARRIVAL,
        is_current: true,
        quantity_remaining: data.quantity, // use rejected/altered pieces
        remarks: "Altered"
      },
    });

    // 4️⃣ Log history
    await tx.department_sub_batch_history.create({
      data: {
        department_sub_batch_id: deptSubBatch.id,
        sub_batch_id: data.sub_batch_id,
        to_stage: DepartmentStage.NEW_ARRIVAL,
        to_department_id: data.target_department_id,
        reason: data.reason,
      },
    });

    return altered;
  });
};

export const getAllAlteredSubBatches = async () => {
  return await prisma.sub_batch_altered.findMany({
    include: {
      sub_batch: true,
      sent_to_department: true,
    },
  });
};
