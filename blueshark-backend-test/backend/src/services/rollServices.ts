import prisma from "../config/db";

interface RollData {
  name: string;
  quantity: number;
  roll_unit_count?: number; // Number of physical roll pieces (e.g., 15 rolls)
  unit: string;
  color: string;
  vendor_id?: number; // optional: connect existing vendor
  batch_ids?: number[]; // optional: connect existing batches
  sub_batch_ids?: number[]; // optional: connect existing sub_batches
}

export const createRoll = async (data: RollData) => {
  const rollData: any = {
    name: data.name,
    quantity: data.quantity,
    roll_unit_count: data.roll_unit_count || null,
    unit: data.unit,
    color: data.color,
  };

  if (data.vendor_id) {
    rollData.vendor = { connect: { id: data.vendor_id } };
  }

  if (data.batch_ids?.length) {
    rollData.batches = {
      connect: data.batch_ids.map((id) => ({ id })),
    };
  }

  if (data.sub_batch_ids?.length) {
    rollData.sub_batches = {
      connect: data.sub_batch_ids.map((id) => ({ id })),
    };
  }

  return await prisma.rolls.create({
    data: rollData,
    include: {
      vendor: true,
      batches: true,
      sub_batches: true,
    },
  });
};

export const getAllRolls = async () => {
  const rolls = await prisma.rolls.findMany({
    include: {
      vendor: true,
      batches: true,
      sub_batches: true,
    },
  });

  // Calculate remaining quantity and remaining unit count for each roll
  // remaining_quantity = roll.quantity - SUM(batches.quantity)
  // remaining_unit_count = roll.roll_unit_count - SUM(batches.unit_count)
  return rolls.map((roll) => {
    const usedQuantity = roll.batches.reduce(
      (sum, batch) => sum + (batch.quantity || 0),
      0
    );
    const usedUnitCount = roll.batches.reduce(
      (sum, batch) => sum + (batch.unit_count || 0),
      0
    );
    return {
      ...roll,
      remaining_quantity: roll.quantity - usedQuantity,
      remaining_unit_count: (roll.roll_unit_count || 0) - usedUnitCount,
    };
  });
};

export const getRollById = async (id: number) => {
  const roll = await prisma.rolls.findUnique({
    where: { id },
    include: {
      vendor: true,
      batches: true,
      sub_batches: true,
    },
  });
  if (!roll) throw new Error("Roll not found");

  // Calculate remaining quantity and unit count
  const usedQuantity = roll.batches.reduce(
    (sum, batch) => sum + (batch.quantity || 0),
    0
  );
  const usedUnitCount = roll.batches.reduce(
    (sum, batch) => sum + (batch.unit_count || 0),
    0
  );

  return {
    ...roll,
    remaining_quantity: roll.quantity - usedQuantity,
    remaining_unit_count: (roll.roll_unit_count || 0) - usedUnitCount,
  };
};

// Get remaining quantity and unit count for a roll (used for batch validation)
export const getRollRemainingQuantity = async (
  rollId: number,
  excludeBatchId?: number
) => {
  const roll = await prisma.rolls.findUnique({
    where: { id: rollId },
    include: {
      batches: {
        select: { id: true, quantity: true, unit_count: true },
      },
    },
  });

  if (!roll) throw new Error("Roll not found");

  // Calculate used quantity and unit count, optionally excluding a specific batch (for updates)
  let usedQuantity = 0;
  let usedUnitCount = 0;

  for (const batch of roll.batches) {
    if (excludeBatchId && batch.id === excludeBatchId) {
      continue; // Exclude this batch from calculation (for update scenarios)
    }
    usedQuantity += batch.quantity || 0;
    usedUnitCount += batch.unit_count || 0;
  }

  return {
    totalQuantity: roll.quantity,
    usedQuantity,
    remainingQuantity: roll.quantity - usedQuantity,
    // Unit count data
    totalUnitCount: roll.roll_unit_count || 0,
    usedUnitCount,
    remainingUnitCount: (roll.roll_unit_count || 0) - usedUnitCount,
  };
};

export const updateRoll = async (id: number, data: Partial<RollData>) => {
  // Validate: If quantity is being reduced, ensure it's not less than allocated to batches
  if (data.quantity !== undefined || data.roll_unit_count !== undefined) {
    const currentRoll = await prisma.rolls.findUnique({
      where: { id },
      include: {
        batches: {
          select: { quantity: true, unit_count: true },
        },
      },
    });

    if (currentRoll) {
      // Validate quantity
      if (data.quantity !== undefined) {
        const totalAllocatedQty = currentRoll.batches.reduce(
          (sum, batch) => sum + (batch.quantity || 0),
          0
        );

        if (data.quantity < totalAllocatedQty) {
          throw new Error(
            `Cannot reduce roll quantity to ${data.quantity}. ` +
            `${totalAllocatedQty} is already allocated to batches.`
          );
        }
      }

      // Validate unit_count
      if (data.roll_unit_count !== undefined) {
        const totalAllocatedUnits = currentRoll.batches.reduce(
          (sum, batch) => sum + (batch.unit_count || 0),
          0
        );

        if (data.roll_unit_count < totalAllocatedUnits) {
          throw new Error(
            `Cannot reduce roll unit count to ${data.roll_unit_count}. ` +
            `${totalAllocatedUnits} units are already allocated to batches.`
          );
        }
      }
    }
  }

  const updateData: any = { ...data };

  if (data.vendor_id) {
    updateData.vendor = { connect: { id: data.vendor_id } };
    delete updateData.vendor_id;
  }

  if (data.batch_ids?.length) {
    updateData.batches = { connect: data.batch_ids.map((id) => ({ id })) };
    delete updateData.batch_ids;
  }

  if (data.sub_batch_ids?.length) {
    updateData.sub_batches = {
      connect: data.sub_batch_ids.map((id) => ({ id })),
    };
    delete updateData.sub_batch_ids;
  }

  return await prisma.rolls.update({
    where: { id },
    data: updateData,
    include: {
      vendor: true,
      batches: true,
      sub_batches: true,
    },
  });
};

export const deleteRoll = async (id: number) => {
  return await prisma.rolls.delete({ where: { id } });
};
