// src/services/departmentSubBatchService.ts
import prisma from "../config/db";

// Get all department_sub_batches entries (all sub-batches)
export const getAllDepartmentSubBatches = async () => {
  const entries = await prisma.department_sub_batches.findMany({
    include: {
      department: true,
      sub_batch: true,
      assigned_worker: true,
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  return entries;
};

// Get all department_sub_batches entries for a specific sub-batch
// This shows all workflows (main, rejected, altered) for a sub-batch
export const getAllEntriesForSubBatch = async (subBatchId: number) => {
  const entries = await prisma.department_sub_batches.findMany({
    where: {
      sub_batch_id: subBatchId,
    },
    include: {
      department: true,
    },
    orderBy: [
      { is_current: 'desc' }, // Show active entries first
      { createdAt: 'desc' },
    ],
  });

  return entries;
};

// Get all department_sub_batch_history entries (for analysis)
export const getAllDepartmentSubBatchHistory = async () => {
  const history = await prisma.department_sub_batch_history.findMany({
    include: {
      department_sub_batch: {
        include: {
          department: true,
          sub_batch: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  return history;
};

// Get sub-batch history: departments where work was completed
export const getSubBatchHistory = async (subBatchId: number) => {
  // Get the planned workflow for this sub-batch
  const workflow = await prisma.sub_batch_workflows.findUnique({
    where: {
      sub_batch_id: subBatchId,
    },
    include: {
      steps: {
        include: {
          department: true,
        },
        orderBy: {
          step_index: 'asc',
        },
      },
    },
  });

  // Build complete planned department flow
  let departmentFlow = '';
  if (workflow && workflow.steps.length > 0) {
    const plannedDepartments = workflow.steps.map(step => step.department?.name || 'Unknown');
    departmentFlow = plannedDepartments.join(' → ');
  }

  // Get all department entries where work was completed (sent to another department)
  const completedDepartments = await prisma.department_sub_batches.findMany({
    where: {
      sub_batch_id: subBatchId,
      sent_to_department_id: { not: null }, // Only entries where work was completed
    },
    include: {
      department: true,
      sent_to_department: true,
    },
    orderBy: [
      { createdAt: 'asc' }, // Chronological order
    ],
  });

  // For each department, fetch worker logs
  const departmentDetails = await Promise.all(
    completedDepartments.map(async (deptEntry) => {
      const workerLogs = await prisma.worker_logs.findMany({
        where: {
          sub_batch_id: subBatchId,
          department_id: deptEntry.department_id,
        },
        include: {
          worker: true,
          rejected_entry: {
            include: {
              sent_to_department: true,
            },
          },
          altered_entry: {
            include: {
              sent_to_department: true,
            },
          },
        },
        orderBy: {
          work_date: 'asc',
        },
      });

      return {
        department_entry_id: deptEntry.id,
        department_id: deptEntry.department_id,
        department_name: deptEntry.department?.name,
        sent_to_department_id: deptEntry.sent_to_department_id,
        sent_to_department_name: deptEntry.sent_to_department?.name,
        arrival_date: deptEntry.createdAt,
        quantity_remaining: deptEntry.quantity_remaining,
        remarks: deptEntry.remarks,
        worker_logs: workerLogs.map((log) => ({
          id: log.id,
          worker_id: log.worker_id,
          worker_name: log.worker_name || log.worker?.name,
          work_date: log.work_date,
          size_category: log.size_category,
          particulars: log.particulars,
          quantity_received: log.quantity_received,
          quantity_worked: log.quantity_worked,
          unit_price: log.unit_price,
          activity_type: log.activity_type,
          rejected: log.rejected_entry?.map((r) => ({
            quantity: r.quantity,
            reason: r.reason,
            sent_to_department_id: r.sent_to_department_id,
            sent_to_department_name: r.sent_to_department?.name,
          })),
          altered: log.altered_entry?.map((a) => ({
            quantity: a.quantity,
            reason: a.reason,
            sent_to_department_id: a.sent_to_department_id,
            sent_to_department_name: a.sent_to_department?.name,
          })),
        })),
      };
    })
  );

  return {
    department_flow: departmentFlow,
    department_details: departmentDetails,
  };
};

// ✅ Assign worker to a department_sub_batch entry
export const assignWorkerToDepartmentSubBatch = async (
  departmentSubBatchId: number,
  workerId: number | null
) => {
  // Verify the department_sub_batch exists
  const deptSubBatch = await prisma.department_sub_batches.findUnique({
    where: { id: departmentSubBatchId },
  });

  if (!deptSubBatch) {
    throw new Error(`Department sub-batch with id ${departmentSubBatchId} not found`);
  }

  // If workerId is provided, verify the worker exists
  if (workerId !== null) {
    const worker = await prisma.workers.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new Error(`Worker with id ${workerId} not found`);
    }
  }

  // Update the assigned_worker_id
  const updated = await prisma.department_sub_batches.update({
    where: { id: departmentSubBatchId },
    data: {
      assigned_worker_id: workerId,
    },
    include: {
      assigned_worker: true,
      department: true,
      sub_batch: true,
    },
  });

  return updated;
};
