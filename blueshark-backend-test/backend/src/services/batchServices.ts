import prisma from "../config/db";
import { getRollRemainingQuantity } from "./rollServices";

// Legacy interface for single-roll batches
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

// NEW: Multi-roll batch interfaces
interface BatchRollInput {
  roll_id: number;
  weight: number;      // Weight to take from this roll
  units?: number;      // Optional: number of units
}

// Size breakdown input for batches
interface SizeBreakdownInput {
  size: string;   // Size name (e.g., "M", "L", "XL", "42", "Free Size")
  pieces: number; // Number of pieces for this size
}

interface CreateBatchWithRollsData {
  name: string;           // Fabric Name
  order_name?: string;    // Order Name
  unit: string;           // Unit type (Kilogram, Meter, Piece)
  color?: string;         // Optional: auto-derived from first roll
  vendor_id?: number;     // Optional: auto-derived from first roll
  rolls: BatchRollInput[]; // Array of rolls with quantities
  total_pieces?: number;  // Expected total pieces (for size breakdown)
  size_breakdown?: SizeBreakdownInput[]; // Size breakdown entries
}

interface BatchRollValidation {
  roll_id: number;
  roll_name: string;
  roll_color: string;
  requested_weight: number;
  available_weight: number;
  is_valid: boolean;
  error_message?: string;
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
    include: {
      roll: true,
      vendor: true,
      batch_rolls: {
        include: { roll: true },
      },
      batch_sizes: true,
    },
  });
};

export const getBatchById = async (id: number) => {
  const batch = await prisma.batches.findUnique({
    where: { id },
    include: {
      roll: true,
      vendor: true,
      batch_rolls: {
        include: { roll: true },
      },
      batch_sizes: true,
    },
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

// ============================================================================
// NEW: Multi-Roll Batch Functions
// ============================================================================

/**
 * Get unique fabric names from rolls (for autocomplete)
 */
export const getUniqueFabricNames = async (): Promise<string[]> => {
  const rolls = await prisma.rolls.findMany({
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });
  return rolls.map((r) => r.name);
};

/**
 * Search rolls by fabric name and return with remaining quantities
 */
export const getRollsByFabricName = async (fabricName: string) => {
  const rolls = await prisma.rolls.findMany({
    where: {
      name: {
        equals: fabricName,
        mode: 'insensitive',
      },
    },
    include: {
      vendor: true,
      batches: {
        select: { quantity: true, unit_count: true },
      },
      batch_rolls: {
        select: { weight: true, units: true },
      },
    },
  });

  // Calculate remaining for each roll
  return rolls.map((roll) => {
    const usedFromBatches = roll.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const usedFromBatchRolls = roll.batch_rolls.reduce((sum, br) => sum + (br.weight || 0), 0);
    const usedUnitsFromBatches = roll.batches.reduce((sum, b) => sum + (b.unit_count || 0), 0);
    const usedUnitsFromBatchRolls = roll.batch_rolls.reduce((sum, br) => sum + (br.units || 0), 0);

    return {
      id: roll.id,
      name: roll.name,
      quantity: roll.quantity,
      roll_unit_count: roll.roll_unit_count,
      unit: roll.unit,
      color: roll.color,
      vendor_id: roll.vendor_id,
      vendor: roll.vendor,
      remaining_quantity: roll.quantity - usedFromBatches - usedFromBatchRolls,
      remaining_unit_count: (roll.roll_unit_count || 0) - usedUnitsFromBatches - usedUnitsFromBatchRolls,
    };
  });
};

/**
 * Validate all rolls before creating/updating a multi-roll batch
 */
export const validateBatchRolls = async (
  rolls: BatchRollInput[],
  excludeBatchId?: number
): Promise<{ isValid: boolean; validations: BatchRollValidation[] }> => {
  const validations: BatchRollValidation[] = [];

  for (const rollInput of rolls) {
    const rollData = await getRollRemainingQuantity(rollInput.roll_id, excludeBatchId);

    // Get roll details for name and color
    const roll = await prisma.rolls.findUnique({
      where: { id: rollInput.roll_id },
      select: { name: true, color: true },
    });

    const isValid = rollInput.weight <= rollData.remainingQuantity;

    validations.push({
      roll_id: rollInput.roll_id,
      roll_name: roll?.name || '',
      roll_color: roll?.color || '',
      requested_weight: rollInput.weight,
      available_weight: rollData.remainingQuantity,
      is_valid: isValid,
      error_message: isValid
        ? undefined
        : `Requested ${rollInput.weight} but only ${rollData.remainingQuantity} available`,
    });
  }

  return {
    isValid: validations.every((v) => v.is_valid),
    validations,
  };
};

/**
 * Create a batch with multiple rolls
 */
export const createBatchWithRolls = async (data: CreateBatchWithRollsData) => {
  // Step 1: Validate all rolls
  const validation = await validateBatchRolls(data.rolls);
  if (!validation.isValid) {
    const errors = validation.validations
      .filter((v) => !v.is_valid)
      .map((v) => `${v.roll_color}: ${v.error_message}`)
      .join('; ');
    throw new Error(`Roll validation failed: ${errors}`);
  }

  // Step 2: Calculate totals
  const totalWeight = data.rolls.reduce((sum, r) => sum + r.weight, 0);
  const totalUnits = data.rolls.reduce((sum, r) => sum + (r.units || 0), 0);

  // Step 3: Get first roll for default color/vendor
  const firstRoll = await prisma.rolls.findUnique({
    where: { id: data.rolls[0].roll_id },
    include: { vendor: true },
  });

  // Step 4: Create batch with nested batch_rolls and batch_sizes
  return await prisma.batches.create({
    data: {
      name: data.name,
      order_name: data.order_name,
      quantity: totalWeight,
      unit: data.unit,
      unit_count: totalUnits > 0 ? totalUnits : null,
      color: data.color || firstRoll?.color || '',
      total_pieces: data.total_pieces || null,
      vendor: data.vendor_id
        ? { connect: { id: data.vendor_id } }
        : firstRoll?.vendor
          ? { connect: { id: firstRoll.vendor.id } }
          : undefined,
      batch_rolls: {
        create: data.rolls.map((r) => ({
          roll: { connect: { id: r.roll_id } },
          weight: r.weight,
          units: r.units || null,
        })),
      },
      // Create size breakdown if provided
      batch_sizes: data.size_breakdown && data.size_breakdown.length > 0
        ? {
            create: data.size_breakdown.map((s) => ({
              size: s.size,
              pieces: s.pieces,
            })),
          }
        : undefined,
    },
    include: {
      batch_rolls: {
        include: { roll: true },
      },
      batch_sizes: true,
      vendor: true,
    },
  });
};

/**
 * Update a batch with multiple rolls
 */
export const updateBatchWithRolls = async (
  batchId: number,
  data: Partial<CreateBatchWithRollsData>
) => {
  // Step 1: Validate rolls if provided
  if (data.rolls && data.rolls.length > 0) {
    const validation = await validateBatchRolls(data.rolls, batchId);
    if (!validation.isValid) {
      const errors = validation.validations
        .filter((v) => !v.is_valid)
        .map((v) => `${v.roll_color}: ${v.error_message}`)
        .join('; ');
      throw new Error(`Roll validation failed: ${errors}`);
    }
  }

  // Step 2: Calculate totals if rolls provided
  const totalWeight = data.rolls?.reduce((sum, r) => sum + r.weight, 0) || 0;
  const totalUnits = data.rolls?.reduce((sum, r) => sum + (r.units || 0), 0) || 0;

  // Step 3: Update batch (delete old batch_rolls/batch_sizes, create new ones)
  return await prisma.$transaction(async (tx) => {
    // Delete existing batch_rolls if new rolls provided
    if (data.rolls) {
      await tx.batch_rolls.deleteMany({
        where: { batch_id: batchId },
      });
    }

    // Delete existing batch_sizes if new size breakdown provided
    if (data.size_breakdown !== undefined) {
      await tx.batch_sizes.deleteMany({
        where: { batch_id: batchId },
      });
    }

    // Build update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.order_name !== undefined) updateData.order_name = data.order_name;
    if (data.unit) updateData.unit = data.unit;
    if (data.color) updateData.color = data.color;
    if (data.vendor_id) updateData.vendor = { connect: { id: data.vendor_id } };

    // Update total_pieces if provided
    if (data.total_pieces !== undefined) {
      updateData.total_pieces = data.total_pieces || null;
    }

    // If rolls provided, update quantity and create new batch_rolls
    if (data.rolls && data.rolls.length > 0) {
      updateData.quantity = totalWeight;
      updateData.unit_count = totalUnits > 0 ? totalUnits : null;
      updateData.batch_rolls = {
        create: data.rolls.map((r) => ({
          roll: { connect: { id: r.roll_id } },
          weight: r.weight,
          units: r.units || null,
        })),
      };
      // Clear legacy roll_id since we're using multi-roll
      updateData.roll = { disconnect: true };
    }

    // If size breakdown provided, create new batch_sizes
    if (data.size_breakdown && data.size_breakdown.length > 0) {
      updateData.batch_sizes = {
        create: data.size_breakdown.map((s) => ({
          size: s.size,
          pieces: s.pieces,
        })),
      };
    }

    // Update batch
    return await tx.batches.update({
      where: { id: batchId },
      data: updateData,
      include: {
        batch_rolls: {
          include: { roll: true },
        },
        batch_sizes: true,
        vendor: true,
      },
    });
  });
};

/**
 * Get batch by ID with batch_rolls and batch_sizes included
 */
export const getBatchWithRolls = async (id: number) => {
  const batch = await prisma.batches.findUnique({
    where: { id },
    include: {
      roll: true,
      vendor: true,
      batch_rolls: {
        include: { roll: true },
      },
      batch_sizes: true,
    },
  });
  if (!batch) throw new Error("Batch not found");
  return batch;
};

/**
 * Get batch size allocation - shows how much of each size is available/allocated
 * Used by SubBatchView to display available sizes for allocation
 */
export const getBatchSizeAllocation = async (batchId: number) => {
  // Get batch with sizes
  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    include: {
      batch_sizes: true,
    },
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  // Get all sub-batches for this batch with their size details
  const subBatches = await prisma.sub_batches.findMany({
    where: { batch_id: batchId },
    include: {
      size_details: true,
    },
  });

  // Calculate allocated per size from sub-batches
  const allocated: { [size: string]: number } = {};
  subBatches.forEach((sb) => {
    sb.size_details.forEach((sd) => {
      // category field in sub_batch_size_details maps to size
      allocated[sd.category] = (allocated[sd.category] || 0) + sd.pieces;
    });
  });

  // Build allocation response
  const sizes = batch.batch_sizes.map((bs) => ({
    size: bs.size,
    total: bs.pieces,
    allocated: allocated[bs.size] || 0,
    available: bs.pieces - (allocated[bs.size] || 0),
  }));

  return {
    batch_id: batchId,
    total_pieces: batch.total_pieces || 0,
    sizes,
  };
};
