// src/services/adminProductionService.ts
import prisma, { Prisma } from "../config/db";

export enum DepartmentStage {
  NEW_ARRIVAL = "NEW_ARRIVAL",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

// Input types - Updated for worker accountability
export interface AdminRejectionInput {
  sub_batch_id: number;
  from_department_id: number;
  quantity: number;
  reason: string;
  worker_log_id: number;
  // return_to_department_id removed - rejection = waste/scrap, no new card created
}

export interface AdminAlterationInput {
  sub_batch_id: number;
  from_department_id: number;
  return_to_department_id: number;
  quantity: number;
  note: string;
  worker_log_id: number;
}

/**
 * Get detailed task information for admin production view
 * @param subBatchId - The sub-batch ID
 * @param departmentId - The current department ID
 */
export const getTaskDetails = async (subBatchId: number, departmentId: number) => {
  // Find the department_sub_batch entry for this sub-batch and department
  const deptSubBatch = await prisma.department_sub_batches.findFirst({
    where: {
      sub_batch_id: subBatchId,
      department_id: departmentId,
      is_current: true, // Only get the current active entry
    },
    include: {
      department: true,
      sub_batch: {
        include: {
          roll: true,
          batch: true,
          attachments: true,
          dept_links: true, // Include department sub-batch links
          workflows: {
            include: {
              steps: {
                include: {
                  department: true,
                },
                orderBy: {
                  step_index: "asc",
                },
              },
            },
          },
        },
      },
      assigned_worker: true,
      sent_to_department: true,
      parent_card: true, // ✅ Include parent card data
    },
  });

  if (!deptSubBatch) {
    throw new Error(`No active task found for sub-batch ${subBatchId} in department ${departmentId}`);
  }

  // Get the department name that sent this sub-batch
  let sentFromDepartmentName = null;
  if (deptSubBatch.sent_from_department) {
    const sentFromDept = await prisma.departments.findUnique({
      where: { id: deptSubBatch.sent_from_department },
      select: { name: true },
    });
    sentFromDepartmentName = sentFromDept?.name || null;
  }

  // Get work history - all worker logs for this sub-batch and department
  // Filter by department_sub_batch_id to get logs for the specific portion only
  const workerLogs = await prisma.worker_logs.findMany({
    where: {
      sub_batch_id: subBatchId,
      department_id: departmentId,
      department_sub_batch_id: deptSubBatch.id, // ✅ Filter by specific portion
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
      work_date: "desc",
    },
  });

  // Build work history array
  const workHistory = workerLogs.map((log: any) => {
    // Calculate rejected and altered totals
    const totalRejected = log.rejected_entry.reduce((sum: number, r: any) => sum + r.quantity, 0);
    const totalAltered = log.altered_entry.reduce((sum: number, a: any) => sum + a.quantity, 0);

    // Combine rejection reasons
    const rejectionReasons = log.rejected_entry
      .map((r: any) => `${r.reason} - Returned to ${r.sent_to_department?.name || "Unknown"}`)
      .join("; ");

    // Combine alteration notes
    const alterationNotes = log.altered_entry
      .map((a: any) => `${a.reason} - Sent to ${a.sent_to_department?.name || "Unknown"}`)
      .join("; ");

    return {
      worker_name: log.worker_name || log.worker?.name || "Unknown",
      assigned_quantity: log.quantity_received || 0,
      produced: log.quantity_worked || 0,
      rejected: totalRejected,
      rejection_reason: rejectionReasons || null,
      altered: totalAltered,
      alteration_note: alterationNotes || null,
      date: log.work_date,
    };
  });

  // Get route steps from workflow
  const routeSteps =
    deptSubBatch.sub_batch?.workflows?.steps.map((step: any) => {
      // Check if this department has been completed
      // A department is completed if there's a dept_link with sent_to_department_id set
      const isCompleted = deptSubBatch.sub_batch?.dept_links.some(
        (link: any) =>
          link.department_id === step.department_id &&
          link.sent_to_department_id !== null
      ) || false;

      return {
        department_id: step.department_id,
        department_name: step.department?.name || "Unknown",
        completed: isCompleted,
      };
    }) || [];

  // Get all available departments (excluding current department)
  const allDepartments = await prisma.departments.findMany({
    where: {
      id: {
        not: departmentId,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate production summary
  const worked = workerLogs.reduce((sum: number, log: any) => sum + (log.quantity_worked || 0), 0);
  const altered = workerLogs.reduce((sum: number, log: any) => {
    return sum + log.altered_entry.reduce((s: number, a: any) => s + a.quantity, 0);
  }, 0);
  const rejected = workerLogs.reduce((sum: number, log: any) => {
    return sum + log.rejected_entry.reduce((s: number, r: any) => s + r.quantity, 0);
  }, 0);
  const remaining = deptSubBatch.quantity_remaining || 0;

  // Get assigned workers (currently only supports one worker per task)
  const assignedWorkers = deptSubBatch.assigned_worker
    ? [
        {
          id: deptSubBatch.assigned_worker.id,
          worker_name: deptSubBatch.assigned_worker.name,
          quantity: deptSubBatch.quantity_remaining || 0,
          date: deptSubBatch.createdAt,
        },
      ]
    : [];

  // Determine linen information
  const linenName = deptSubBatch.sub_batch?.roll?.name ||
                    deptSubBatch.sub_batch?.batch?.name ||
                    "Unknown";
  const linenCode = `${deptSubBatch.sub_batch?.roll?.id || deptSubBatch.sub_batch?.batch?.id || "N/A"}`;

  return {
    success: true,
    data: {
      // Task Information
      department_name: deptSubBatch.department?.name || "Unknown",
      roll_name: deptSubBatch.sub_batch?.roll?.name || null,
      batch_name: deptSubBatch.sub_batch?.batch?.name || null,
      sub_batch_name: deptSubBatch.sub_batch?.name || "Unknown",
      estimated_start_date: deptSubBatch.sub_batch?.start_date,
      due_date: deptSubBatch.sub_batch?.due_date,
      total_quantity: deptSubBatch.total_quantity || 0,
      sent_from_department: sentFromDepartmentName,
      status: deptSubBatch.stage, // NEW_ARRIVAL, IN_PROGRESS, COMPLETED

      // Work History
      work_history: workHistory,

      // Route Details
      linen_name: linenName,
      linen_code: linenCode,
      route_steps: routeSteps,

      // Attachments
      attachments:
        deptSubBatch.sub_batch?.attachments.map((att: any) => ({
          name: att.attachment_name,
          quantity: att.quantity,
        })) || [],

      // Production Summary
      worked,
      altered,
      rejected,
      remaining,

      // Currently assigned workers
      assigned_workers: assignedWorkers,

      // Available departments to send to
      available_departments: allDepartments,

      // IDs for API operations
      sub_batch_id: deptSubBatch.sub_batch_id,
      department_sub_batch_id: deptSubBatch.id,
    },
  };
};

/**
 * Create rejection from admin production view
 * @param data - Rejection input data
 */
export const createRejection = async (data: AdminRejectionInput) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Find and validate the worker_log
    const workerLog = await tx.worker_logs.findUnique({
      where: { id: data.worker_log_id },
    });

    if (!workerLog) {
      throw new Error(`Worker log ${data.worker_log_id} not found`);
    }

    if (!workerLog.quantity_worked || workerLog.quantity_worked < data.quantity) {
      throw new Error(
        `Insufficient quantity in worker assignment. Worker has ${workerLog.quantity_worked} pieces, requested: ${data.quantity}`
      );
    }

    // 2️⃣ Find the current active department_sub_batch entry
    const sourceEntry = await tx.department_sub_batches.findFirst({
      where: {
        sub_batch_id: data.sub_batch_id,
        department_id: data.from_department_id,
        is_current: true,
      },
    });

    if (!sourceEntry) {
      throw new Error(
        `No active entry found for sub-batch ${data.sub_batch_id} in department ${data.from_department_id}`
      );
    }

    // 3️⃣ Reduce worker's assignment
    await tx.worker_logs.update({
      where: { id: data.worker_log_id },
      data: {
        quantity_worked: { decrement: data.quantity },
      },
    });

    // 4️⃣ Reduce quantity_assigned from source entry (coming from worker's assignment)
    await tx.department_sub_batches.update({
      where: {
        id: sourceEntry.id,
      },
      data: {
        quantity_assigned: { decrement: data.quantity },
      },
    });

    // 5️⃣ Create sub_batch_rejected record (waste/scrap log only - NO new card)
    const rejected = await tx.sub_batch_rejected.create({
      data: {
        sub_batch_id: data.sub_batch_id,
        quantity: data.quantity,
        reason: data.reason,
        sent_to_department_id: null, // No department - items are waste/scrap
        source_department_sub_batch_id: sourceEntry.id,
        created_department_sub_batch_id: null, // No new card created
        worker_log_id: data.worker_log_id, // Track which worker's work was rejected
      },
    });

    return {
      rejection_id: rejected.id,
      sub_batch_id: rejected.sub_batch_id || data.sub_batch_id,
      from_department_id: data.from_department_id,
      quantity: rejected.quantity,
      reason: rejected.reason,
    };
  });
};

/**
 * Create alteration from admin production view
 * @param data - Alteration input data
 */
export const createAlteration = async (data: AdminAlterationInput) => {
  try {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1️⃣ Find and validate the worker_log
      const workerLog = await tx.worker_logs.findUnique({
        where: { id: data.worker_log_id },
      });

      if (!workerLog) {
        throw new Error(`Worker log ${data.worker_log_id} not found`);
      }

      if (!workerLog.quantity_worked || workerLog.quantity_worked < data.quantity) {
        throw new Error(
          `Insufficient quantity in worker assignment. Worker has ${workerLog.quantity_worked} pieces, requested: ${data.quantity}`
        );
      }

      // 2️⃣ Find the current active department_sub_batch entry
      const sourceEntry = await tx.department_sub_batches.findFirst({
        where: {
          sub_batch_id: data.sub_batch_id,
          department_id: data.from_department_id,
          is_current: true,
        },
      });

      if (!sourceEntry) {
        throw new Error(
          `No active entry found for sub-batch ${data.sub_batch_id} in department ${data.from_department_id}`
        );
      }

    // 3️⃣ Reduce worker's assignment
    await tx.worker_logs.update({
      where: { id: data.worker_log_id },
      data: {
        quantity_worked: { decrement: data.quantity },
      },
    });

    // 4️⃣ Reduce quantity_assigned from source entry (coming from worker's assignment)
    // Handle null quantity_assigned - set to 0 first if null, then decrement
    const currentAssigned = sourceEntry.quantity_assigned || 0;
    await tx.department_sub_batches.update({
      where: {
        id: sourceEntry.id,
      },
      data: {
        quantity_assigned: Math.max(0, currentAssigned - data.quantity),
      },
    });

    // 5️⃣ Create new department_sub_batches record for altered pieces (new Main card in target department)
    const newDeptSubBatch = await tx.department_sub_batches.create({
      data: {
        sub_batch_id: data.sub_batch_id,
        department_id: data.return_to_department_id,
        parent_department_sub_batch_id: null, // ✅ New Main card has no parent in the new department
        stage: DepartmentStage.NEW_ARRIVAL,
        is_current: true,
        quantity_remaining: data.quantity,
        quantity_received: data.quantity,
        total_quantity: sourceEntry.total_quantity,
        remarks: "ALTERED",
        alter_reason: data.note,
        sent_from_department: data.from_department_id,
      },
    });

    // 6️⃣ Create sub_batch_altered record (with worker_log_id for tracking)
    const altered = await tx.sub_batch_altered.create({
      data: {
        sub_batch_id: data.sub_batch_id,
        quantity: data.quantity,
        reason: data.note,
        sent_to_department_id: data.return_to_department_id,
        source_department_sub_batch_id: sourceEntry.id,
        created_department_sub_batch_id: newDeptSubBatch.id,
        worker_log_id: data.worker_log_id, // ✅ Link to worker log for accountability tracking
      },
    });

    // 7️⃣ Log history
    await tx.department_sub_batch_history.create({
      data: {
        department_sub_batch_id: newDeptSubBatch.id,
        sub_batch_id: data.sub_batch_id,
        to_stage: DepartmentStage.NEW_ARRIVAL,
        to_department_id: data.return_to_department_id,
        reason: data.note,
      },
    });

      return {
        alteration_id: altered.id,
        sub_batch_id: altered.sub_batch_id,
        from_department_id: data.from_department_id,
        return_to_department_id: altered.sent_to_department_id,
        quantity: altered.quantity,
        note: altered.reason,
        created_at: newDeptSubBatch.createdAt,
      };
    });
  } catch (error: any) {
    throw error;
  }
};
