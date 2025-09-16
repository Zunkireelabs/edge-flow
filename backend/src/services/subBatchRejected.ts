// src/services/subBatchRejected.ts
import prisma from "../config/db";

// Input type
interface RejectedData {
  sub_batch_id: number;
  quantity: number;
  reason: string;
  sent_to_department_id: number; // where rejected pieces go
  original_department_id: number; // department from which quantity is reduced
}

export async function createRejectedSubBatch(data: RejectedData) {
  const {
    sub_batch_id,
    quantity,
    reason,
    sent_to_department_id,
    original_department_id,
  } = data;

  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Add record to sub_batch_rejected
    const rejected = await tx.sub_batch_rejected.create({
      data: {
        sub_batch_id,
        quantity,
        reason,
        sent_to_department_id,
      },
    });

    // 2️⃣ Reduce quantity from original department
    await tx.department_sub_batches.updateMany({
      where: {
        sub_batch_id,
        department_id: original_department_id,
        is_current: true,
      },
      data: {
        quantity_remaining: { decrement: quantity },
      },
    });

    // 3️⃣ Create new department_sub_batches record for rejected pieces
    const newDeptSubBatch = await tx.department_sub_batches.create({
      data: {
        sub_batch_id,
        department_id: sent_to_department_id,
        stage: "NEW_ARRIVAL",
        is_current: true,
        quantity_remaining: quantity,
        remarks: "Rejected"
      },
    });

    // 4️⃣ Log history
    await tx.department_sub_batch_history.create({
      data: {
        department_sub_batch_id: newDeptSubBatch.id,
        sub_batch_id,
        from_stage: null,
        to_stage: "NEW_ARRIVAL",
        to_department_id: sent_to_department_id,
        reason,
      },
    });

    return rejected;
  });
}
