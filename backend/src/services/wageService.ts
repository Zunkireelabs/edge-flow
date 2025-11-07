// src/services/wageService.ts
import prisma, { Prisma } from "../config/db";

export interface WageCalculation {
  worker_id: number;
  worker_name: string;
  total_billable_wages: number;
  total_non_billable_wages: number;
  total_quantity_worked: number;
  billable_quantity: number;
  non_billable_quantity: number;
  total_entries: number;
  billable_entries: number;
  non_billable_entries: number;
}

export interface DetailedWorkLog {
  id: number;
  work_date: Date | null;
  sub_batch_name: string;
  quantity_worked: number;
  unit_price: number;
  amount: number;
  is_billable: boolean;
  activity_type: string | null;
  particulars: string | null;
}

export interface WageReport {
  summary: WageCalculation;
  detailed_logs: DetailedWorkLog[];
}

/**
 * Calculate wages for a specific worker within a date range
 */
export const calculateWorkerWages = async (
  workerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<WageReport> => {
  // Build where clause
  const whereClause: Prisma.worker_logsWhereInput = {
    worker_id: workerId,
  };

  if (startDate || endDate) {
    whereClause.work_date = {};
    if (startDate) whereClause.work_date.gte = startDate;
    if (endDate) whereClause.work_date.lte = endDate;
  }

  // Get all logs for this worker
  const logs = await prisma.worker_logs.findMany({
    where: whereClause,
    include: {
      sub_batch: {
        select: {
          name: true,
        },
      },
      worker: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      work_date: "desc",
    },
  });

  if (logs.length === 0) {
    throw new Error(`No work logs found for worker ${workerId}`);
  }

  // Calculate summary
  let totalBillableWages = 0;
  let totalNonBillableWages = 0;
  let totalQuantityWorked = 0;
  let billableQuantity = 0;
  let nonBillableQuantity = 0;
  let billableEntries = 0;
  let nonBillableEntries = 0;

  const detailedLogs: DetailedWorkLog[] = logs.map((log) => {
    const qtyWorked = log.quantity_worked || 0;
    const unitPrice = log.unit_price || 0;
    const amount = qtyWorked * unitPrice;

    totalQuantityWorked += qtyWorked;

    if (log.is_billable) {
      totalBillableWages += amount;
      billableQuantity += qtyWorked;
      billableEntries++;
    } else {
      totalNonBillableWages += amount;
      nonBillableQuantity += qtyWorked;
      nonBillableEntries++;
    }

    return {
      id: log.id,
      work_date: log.work_date,
      sub_batch_name: log.sub_batch.name,
      quantity_worked: qtyWorked,
      unit_price: unitPrice,
      amount: amount,
      is_billable: log.is_billable,
      activity_type: log.activity_type,
      particulars: log.particulars,
    };
  });

  const summary: WageCalculation = {
    worker_id: workerId,
    worker_name: logs[0].worker.name,
    total_billable_wages: totalBillableWages,
    total_non_billable_wages: totalNonBillableWages,
    total_quantity_worked: totalQuantityWorked,
    billable_quantity: billableQuantity,
    non_billable_quantity: nonBillableQuantity,
    total_entries: logs.length,
    billable_entries: billableEntries,
    non_billable_entries: nonBillableEntries,
  };

  return {
    summary,
    detailed_logs: detailedLogs,
  };
};

/**
 * Calculate wages for all workers in a date range
 */
export const calculateAllWorkersWages = async (
  startDate?: Date,
  endDate?: Date,
  departmentId?: number
): Promise<WageCalculation[]> => {
  // Build where clause
  const whereClause: Prisma.worker_logsWhereInput = {};

  if (startDate || endDate) {
    whereClause.work_date = {};
    if (startDate) whereClause.work_date.gte = startDate;
    if (endDate) whereClause.work_date.lte = endDate;
  }

  // Get all logs
  const logs = await prisma.worker_logs.findMany({
    where: whereClause,
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          department_id: true,
        },
      },
    },
  });

  // Filter by department if specified
  const filteredLogs = departmentId
    ? logs.filter((log) => log.worker.department_id === departmentId)
    : logs;

  // Group by worker
  const workerMap = new Map<number, typeof filteredLogs>();
  filteredLogs.forEach((log) => {
    const workerId = log.worker_id;
    if (!workerMap.has(workerId)) {
      workerMap.set(workerId, []);
    }
    workerMap.get(workerId)!.push(log);
  });

  // Calculate wages for each worker
  const results: WageCalculation[] = [];

  for (const [workerId, workerLogs] of workerMap.entries()) {
    let totalBillableWages = 0;
    let totalNonBillableWages = 0;
    let totalQuantityWorked = 0;
    let billableQuantity = 0;
    let nonBillableQuantity = 0;
    let billableEntries = 0;
    let nonBillableEntries = 0;

    workerLogs.forEach((log) => {
      const qtyWorked = log.quantity_worked || 0;
      const unitPrice = log.unit_price || 0;
      const amount = qtyWorked * unitPrice;

      totalQuantityWorked += qtyWorked;

      if (log.is_billable) {
        totalBillableWages += amount;
        billableQuantity += qtyWorked;
        billableEntries++;
      } else {
        totalNonBillableWages += amount;
        nonBillableQuantity += qtyWorked;
        nonBillableEntries++;
      }
    });

    results.push({
      worker_id: workerId,
      worker_name: workerLogs[0].worker.name,
      total_billable_wages: totalBillableWages,
      total_non_billable_wages: totalNonBillableWages,
      total_quantity_worked: totalQuantityWorked,
      billable_quantity: billableQuantity,
      non_billable_quantity: nonBillableQuantity,
      total_entries: workerLogs.length,
      billable_entries: billableEntries,
      non_billable_entries: nonBillableEntries,
    });
  }

  // Sort by total billable wages descending
  return results.sort((a, b) => b.total_billable_wages - a.total_billable_wages);
};

/**
 * Get only billable work logs
 */
export const getBillableWorkLogs = async (
  workerId?: number,
  startDate?: Date,
  endDate?: Date
) => {
  const whereClause: Prisma.worker_logsWhereInput = {
    is_billable: true,
  };

  if (workerId) whereClause.worker_id = workerId;

  if (startDate || endDate) {
    whereClause.work_date = {};
    if (startDate) whereClause.work_date.gte = startDate;
    if (endDate) whereClause.work_date.lte = endDate;
  }

  return await prisma.worker_logs.findMany({
    where: whereClause,
    include: {
      worker: {
        select: {
          id: true,
          name: true,
        },
      },
      sub_batch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      work_date: "desc",
    },
  });
};

/**
 * Get department-wise wage summary
 */
export const getDepartmentWageSummary = async (
  departmentId: number,
  startDate?: Date,
  endDate?: Date
) => {
  // Get all workers in this department
  const workers = await prisma.workers.findMany({
    where: { department_id: departmentId },
    select: {
      id: true,
      name: true,
    },
  });

  const workerIds = workers.map((w) => w.id);

  if (workerIds.length === 0) {
    return {
      department_id: departmentId,
      total_workers: 0,
      total_billable_wages: 0,
      total_non_billable_wages: 0,
      workers: [],
    };
  }

  // Get wages for all workers in department
  const workerWages = await calculateAllWorkersWages(
    startDate,
    endDate,
    departmentId
  );

  const totalBillableWages = workerWages.reduce(
    (sum, w) => sum + w.total_billable_wages,
    0
  );
  const totalNonBillableWages = workerWages.reduce(
    (sum, w) => sum + w.total_non_billable_wages,
    0
  );

  return {
    department_id: departmentId,
    total_workers: workers.length,
    total_billable_wages: totalBillableWages,
    total_non_billable_wages: totalNonBillableWages,
    workers: workerWages,
  };
};

/**
 * Get wage summary by sub-batch
 */
export const getSubBatchWageSummary = async (subBatchId: number) => {
  const logs = await prisma.worker_logs.findMany({
    where: { sub_batch_id: subBatchId },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by worker
  const workerMap = new Map<number, typeof logs>();
  logs.forEach((log) => {
    const workerId = log.worker_id;
    if (!workerMap.has(workerId)) {
      workerMap.set(workerId, []);
    }
    workerMap.get(workerId)!.push(log);
  });

  // Calculate wages for each worker
  const workerWages = [];
  let totalBillableWages = 0;
  let totalNonBillableWages = 0;

  for (const [workerId, workerLogs] of workerMap.entries()) {
    let billableWages = 0;
    let nonBillableWages = 0;

    workerLogs.forEach((log) => {
      const amount = (log.quantity_worked || 0) * (log.unit_price || 0);
      if (log.is_billable) {
        billableWages += amount;
      } else {
        nonBillableWages += amount;
      }
    });

    totalBillableWages += billableWages;
    totalNonBillableWages += nonBillableWages;

    workerWages.push({
      worker_id: workerId,
      worker_name: workerLogs[0].worker.name,
      billable_wages: billableWages,
      non_billable_wages: nonBillableWages,
      total_wages: billableWages + nonBillableWages,
      entries: workerLogs.length,
    });
  }

  return {
    sub_batch_id: subBatchId,
    total_billable_wages: totalBillableWages,
    total_non_billable_wages: totalNonBillableWages,
    total_wages: totalBillableWages + totalNonBillableWages,
    workers: workerWages.sort((a, b) => b.billable_wages - a.billable_wages),
  };
};
