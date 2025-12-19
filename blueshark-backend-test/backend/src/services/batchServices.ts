import prisma from "../config/db";
import { getRollRemainingQuantity } from "./rollServices";

interface BatchData {
  name: string;        // Fabric Name
  order_name?: string; // Order Name
  quantity: number;
  unit?: string;
  unit_count?: number; // Number of fabric pieces
  color?: string;
  roll_id?: number;
  vendor_id?: number;
}

export const createBatch = async (data: BatchData) => {
  // Validate quantity and unit_count against roll's remaining values
  if (data.roll_id) {
    const rollData = await getRollRemainingQuantity(data.roll_id);

    // Validate quantity
    if (data.quantity > rollData.remainingQuantity) {
      throw new Error(
        `Batch quantity (${data.quantity}) exceeds available roll quantity (${rollData.remainingQuantity}). ` +
        `Roll total: ${rollData.totalQuantity}, Already used: ${rollData.usedQuantity}`
      );
    }

    // Validate unit_count (only if both roll has unit count AND batch has unit count)
    if (data.unit_count && rollData.totalUnitCount > 0) {
      if (data.unit_count > rollData.remainingUnitCount) {
        throw new Error(
          `Batch unit count (${data.unit_count}) exceeds available roll units (${rollData.remainingUnitCount}). ` +
          `Roll total: ${rollData.totalUnitCount} units, Already used: ${rollData.usedUnitCount} units`
        );
      }
    }
  }

  const batchData: any = {
    name: data.name,
    quantity: data.quantity,
  };

  if (data.order_name) batchData.order_name = data.order_name;
  if (data.unit) batchData.unit = data.unit;
  if (data.unit_count !== undefined) batchData.unit_count = data.unit_count;
  if (data.color) batchData.color = data.color;
  if (data.roll_id) batchData.roll = { connect: { id: data.roll_id } };
  if (data.vendor_id) batchData.vendor = { connect: { id: data.vendor_id } };

  return await prisma.batches.create({
    data: batchData,
    include: { roll: true, vendor: true },
  });
};

export const getAllBatches = async () => {
  return await prisma.batches.findMany({
    include: { roll: true, vendor:true },
  });
};

export const getBatchById = async (id: number) => {
  const batch = await prisma.batches.findUnique({
    where: { id },
    include: { roll: true, vendor:true },
  });
  if (!batch) throw new Error("Batch not found");
  return batch;
};

export const updateBatch = async (id: number, data: Partial<BatchData>) => {
  // If quantity or unit_count is being updated and batch has a roll, validate against remaining
  if (data.quantity !== undefined || data.unit_count !== undefined) {
    // Get current batch to find its roll_id
    const currentBatch = await prisma.batches.findUnique({
      where: { id },
      select: { roll_id: true },
    });

    const rollId = data.roll_id || currentBatch?.roll_id;

    if (rollId) {
      // Exclude current batch from calculation since we're updating it
      const rollData = await getRollRemainingQuantity(rollId, id);

      // Validate quantity
      if (data.quantity !== undefined && data.quantity > rollData.remainingQuantity) {
        throw new Error(
          `Batch quantity (${data.quantity}) exceeds available roll quantity (${rollData.remainingQuantity}). ` +
          `Roll total: ${rollData.totalQuantity}, Already used by other batches: ${rollData.usedQuantity}`
        );
      }

      // Validate unit_count (only if roll has unit count)
      if (data.unit_count !== undefined && rollData.totalUnitCount > 0) {
        if (data.unit_count > rollData.remainingUnitCount) {
          throw new Error(
            `Batch unit count (${data.unit_count}) exceeds available roll units (${rollData.remainingUnitCount}). ` +
            `Roll total: ${rollData.totalUnitCount} units, Already used by other batches: ${rollData.usedUnitCount} units`
          );
        }
      }
    }
  }

  const updateData: any = { ...data };

  if (data.roll_id) {
    updateData.roll = { connect: { id: data.roll_id } };
    delete updateData.roll_id; // remove to avoid conflict
  }
  if (data.vendor_id) {
    updateData.vendor = { connect: { id: data.vendor_id } };
    delete updateData.vendor_id;
  }

  return await prisma.batches.update({
    where: { id },
    data: updateData,
    include: { roll: true, vendor: true },
  });
};

/**
 * Delete a batch and all its related sub-batches and their dependencies
 * Cascade delete order:
 * 1. Get all sub-batches for this batch
 * 2. For each sub-batch, delete all related records:
 *    - worker_logs
 *    - sub_batch_size_details
 *    - sub_batch_attachments
 *    - sub_batch_altered
 *    - sub_batch_rejected
 *    - sub_batch_workflows
 *    - department_sub_batches
 * 3. Delete all sub-batches
 * 4. Delete the batch
 */
export const deleteBatch = async (id: number) => {
  // Get all sub-batches for this batch
  const subBatches = await prisma.sub_batches.findMany({
    where: { batch_id: id },
    select: { id: true },
  });

  const subBatchIds = subBatches.map((sb) => sb.id);

  if (subBatchIds.length > 0) {
    // Delete all related records for these sub-batches
    // Order matters: delete child records first

    // 1. Delete worker logs
    await prisma.worker_logs.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 2. Delete size details
    await prisma.sub_batch_size_details.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 3. Delete attachments
    await prisma.sub_batch_attachments.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 4. Delete altered records
    await prisma.sub_batch_altered.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 5. Delete rejected records
    await prisma.sub_batch_rejected.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 6. Delete workflows
    await prisma.sub_batch_workflows.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 7. Delete department sub-batches
    await prisma.department_sub_batches.deleteMany({
      where: { sub_batch_id: { in: subBatchIds } },
    });

    // 8. Delete all sub-batches
    await prisma.sub_batches.deleteMany({
      where: { batch_id: id },
    });
  }

  // Finally, delete the batch itself
  return await prisma.batches.delete({
    where: { id },
  });
};

/**
 * Check which batches have sub-batches and which don't
 * @param batchIds - Array of batch IDs to check
 * @returns Object with arrays of batch IDs categorized by sub-batch presence
 */
export const checkBatchDependencies = async (batchIds: number[]) => {
  const batchesWithSubBatches: number[] = [];
  const cleanBatches: number[] = [];

  // Check each batch for sub-batches
  for (const batchId of batchIds) {
    const subBatchCount = await prisma.sub_batches.count({
      where: { batch_id: batchId },
    });

    if (subBatchCount > 0) {
      batchesWithSubBatches.push(batchId);
    } else {
      cleanBatches.push(batchId);
    }
  }

  return {
    batchesWithSubBatches,
    cleanBatches,
  };
};
