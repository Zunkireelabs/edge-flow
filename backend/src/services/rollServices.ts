import prisma from "../config/db";

interface RollData {
  name: string;
  quantity: number;
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
  return await prisma.rolls.findMany({
    include: {
      vendor: true,
      batches: true,
      sub_batches: true,
    },
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
  return roll;
};

export const updateRoll = async (id: number, data: Partial<RollData>) => {
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
