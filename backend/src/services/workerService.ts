import prisma from "../config/db";

// ✅ Create Worker
export const createWorker = async (data: {
  name: string;
  pan: string;
  address: string;
  department_id?: number;
  wage_type: string;
  wage_rate: number;
}) => {
  return await prisma.workers.create({
    data,
  });
};

// ✅ Get All Workers
export const getAllWorkers = async () => {
  return await prisma.workers.findMany({
    include: {
      department: true, // fetch department details
    },
  });
};

// ✅ Get Worker by ID
export const getWorkerById = async (id: number) => {
  return await prisma.workers.findUnique({
    where: { id },
    include: {
      department: true,
    },
  });
};

// ✅ Update Worker
export const updateWorker = async (
  id: number,
  data: {
    name?: string;
    pan?: string;
    address?: string;
    department_id?: number;
    wage_type?: string;
    wage_rate?: number;
  }
) => {
  return await prisma.workers.update({
    where: { id },
    data,
  });
};

// ✅ Delete Worker
export const deleteWorker = async (id: number) => {
  return await prisma.workers.delete({
    where: { id },
  });
};

