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

  // Calculate remaining quantity for each roll
  // remaining_quantity = roll.quantity - SUM(batches.quantity)
  return rolls.map((roll) => {
    const usedQuantity = roll.batches.reduce(
      (sum, batch) => sum + (batch.quantity || 0),
      0
    );
    return {
      ...roll,
      remaining_quantity: roll.quantity - usedQuantity,
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

  // Calculate remaining quantity
  const usedQuantity = roll.batches.reduce(
    (sum, batch) => sum + (batch.quantity || 0),
    0
  );

  return {
    ...roll,
    remaining_quantity: roll.quantity - usedQuantity,
  };
};

// Get remaining quantity for a roll (used for batch validation)
export const getRollRemainingQuantity = async (
  rollId: number,
  excludeBatchId?: number
) => {
  const roll = await prisma.rolls.findUnique({
    where: { id: rollId },
    include: {
      batches: {
        select: { id: true, quantity: true },
      },
    },
  });

  if (!roll) throw new Error("Roll not found");

  // Calculate used quantity, optionally excluding a specific batch (for updates)
  const usedQuantity = roll.batches.reduce((sum, batch) => {
    if (excludeBatchId && batch.id === excludeBatchId) {
      return sum; // Exclude this batch from calculation (for update scenarios)
    }
    return sum + (batch.quantity || 0);
  }, 0);

  return {
    totalQuantity: roll.quantity,
    usedQuantity,
    remainingQuantity: roll.quantity - usedQuantity,
  };
};

export const updateRoll = async (id: number, data: Partial<RollData>) => {
  // Validate: If quantity is being reduced, ensure it's not less than allocated to batches
  if (data.quantity !== undefined) {
    const currentRoll = await prisma.rolls.findUnique({
      where: { id },
      include: {
        batches: {
          select: { quantity: true },
        },
      },
    });

    if (currentRoll) {
      const totalAllocated = currentRoll.batches.reduce(
        (sum, batch) => sum + (batch.quantity || 0),
        0
      );

      if (data.quantity < totalAllocated) {
        throw new Error(
          `Cannot reduce roll quantity to ${data.quantity}. ` +
          `${totalAllocated} is already allocated to batches.`
        );
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
