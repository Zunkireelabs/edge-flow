import prisma from "../config/db";

/// ✅ Create Worker Log
export const createWorkerLog = async (data: {
  worker_id: number;
  sub_batch_id: number;
  worker_name?: string;
  work_date?: string;
  size_category?: string;
  particulars?: string;
  quantity_received?: number;
  quantity_worked?: number;
  unit_price?: number;
}) => {
  return await prisma.worker_logs.create({
    data: {
      ...data,
      work_date: data.work_date ? new Date(data.work_date) : undefined, // ✅ convert here
    },
  });
};

// ✅ Get All Worker Logs
export const getAllWorkerLogs = async () => {
  return await prisma.worker_logs.findMany({
    include: {
      worker: true,
      sub_batch: true,
    },
  });
};

// ✅ Get Worker Log by ID
export const getWorkerLogById = async (id: number) => {
  return await prisma.worker_logs.findUnique({
    where: { id },
    include: {
      worker: true,
      sub_batch: true,
    },
  });
};

// ✅ Update Worker Log
export const updateWorkerLog = async (
  id: number,
  data: {
    worker_id?: number;
    sub_batch_id?: number;
    worker_name?: string;
    work_date?: Date;
    size_category?: string;
    particulars?: string;
    quantity_received?: number;
    quantity_worked?: number;
    unit_price?: number;
  }
) => {
  return await prisma.worker_logs.update({
    where: { id },
    data,
  });
};

// ✅ Delete Worker Log
export const deleteWorkerLog = async (id: number) => {
  return await prisma.worker_logs.delete({
    where: { id },
  });
};
