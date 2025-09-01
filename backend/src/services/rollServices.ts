import prisma from "../config/db";

interface RollData {
  name: string;
  quantity: number;
  unit: string;
  color: string;
  vendor_id?: number; // optional
}

export const createRoll = async (data: RollData) => {
  const rollData: any = {
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    color: data.color,
  };

  // connect vendor if vendor_id is provided
  if (data.vendor_id) {
    rollData.vendor = { connect: { id: data.vendor_id } };
  }

  return await prisma.rolls.create({
    data: rollData,
  });
};

export const getAllRolls = async () => {
  return await prisma.rolls.findMany({
    include: { vendor: true },
  });
};

export const getRollById = async (id: number) => {
  const roll = await prisma.rolls.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!roll) throw new Error("Roll not found");
  return roll;
};

export const updateRoll = async (id: number, data: Partial<RollData>) => {
  const updateData: any = { ...data };
  if (data.vendor_id) {
    updateData.vendor = { connect: { id: data.vendor_id } };
    delete updateData.vendor_id; // remove to avoid conflict
  }
  return await prisma.rolls.update({
    where: { id },
    data: updateData,
  });
};

export const deleteRoll = async (id: number) => {
  return await prisma.rolls.delete({ where: { id } });
};
