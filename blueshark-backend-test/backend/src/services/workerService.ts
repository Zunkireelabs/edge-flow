import prisma from "../config/db";

// ✅ Create Worker
export const createWorker = async (data: {
  name: string;
  pan?: string;      // Optional
  address?: string;  // Optional
  department_id?: number;
  wage_type?: string;  // Optional - defaults to HOURLY
  wage_rate?: number;  // Optional - defaults to 0
}) => {
  return await prisma.workers.create({
    data: {
      name: data.name,
      pan: data.pan || "",           // Default to empty string
      address: data.address || "",   // Default to empty string
      wage_type: data.wage_type || "HOURLY",  // Default to HOURLY
      wage_rate: data.wage_rate || 0,  // Default to 0
      department_id: data.department_id,
    },
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

// ✅ Get Workers by Department ID (via department_workers junction table)
export const getWorkersByDepartment = async (departmentId: number) => {
  // Query through department_workers junction table
  const departmentWorkers = await prisma.department_workers.findMany({
    where: {
      department_id: departmentId,
    },
    include: {
      worker: true, // Include full worker details
    },
    orderBy: {
      worker: {
        name: "asc", // Sort by worker name alphabetically
      },
    },
  });

  // Extract and return just the worker objects
  return departmentWorkers.map(dw => dw.worker);
};

