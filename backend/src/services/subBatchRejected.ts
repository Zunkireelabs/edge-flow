// src/services/subBatchRejected.ts
import { PrismaClient, Prisma } from "../generated/prisma"; // adjust if using default @prisma/client

const prisma = new PrismaClient();

// Define a type for input
interface RejectedData {
  sub_batch_id: number;
  quantity: number;
  reason: string;
  sent_to_department_id: number;
}

export async function createRejectedSubBatch(data: RejectedData) {
  const { sub_batch_id, quantity, reason, sent_to_department_id } = data;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Add record to sub_batch_rejected
    const rejected = await tx.sub_batch_rejected.create({
      data: {
        sub_batch_id,
        quantity,
        reason,
        sent_to_department_id,
      },
    });

    // 2️⃣ Move the sub-batch to the target department
    await tx.department_sub_batches.create({
      data: {
        sub_batch_id,
        department_id: sent_to_department_id,
        stage: "NEW_ARRIVAL", // string literal, no enum needed
        is_current: true,
      },
    });

    return rejected;
  });
}
