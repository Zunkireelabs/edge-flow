import prisma from "../config/db";

interface BatchData {
  name: string;
  quantity: number;
  unit?: string; // optional
  color?: string; // optional
  roll_id?: number; // optional
}

export const createBatch = async (data: BatchData) => {
  const batchData: any = {
    name: data.name,
    quantity: data.quantity,
  };

  if (data.unit) batchData.unit = data.unit;
  if (data.color) batchData.color = data.color;
  if (data.roll_id) batchData.roll = { connect: { id: data.roll_id } };

  return await prisma.batches.create({
    data: batchData,
    include: { roll: true }, // include roll info if connected
  });
};

export const getAllBatches = async () => {
  return await prisma.batches.findMany({
    include: { roll: true },
  });
};

export const getBatchById = async (id: number) => {
  const batch = await prisma.batches.findUnique({
    where: { id },
    include: { roll: true },
  });
  if (!batch) throw new Error("Batch not found");
  return batch;
};

export const updateBatch = async (id: number, data: Partial<BatchData>) => {
  const updateData: any = { ...data };

  if (data.roll_id) {
    updateData.roll = { connect: { id: data.roll_id } };
    delete updateData.roll_id; // remove to avoid conflict
  }

  return await prisma.batches.update({
    where: { id },
    data: updateData,
    include: { roll: true },
  });
};

export const deleteBatch = async (id: number) => {
  return await prisma.batches.delete({
    where: { id },
  });
};
