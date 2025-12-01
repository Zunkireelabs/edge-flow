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
// OPTIMIZED: Fixed N+1 query issue - now fetches all worker logs in single query
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

  // OPTIMIZATION: Fetch ALL worker logs for this sub-batch in a single query
  // instead of N separate queries (one per department)
  const allWorkerLogs = await prisma.worker_logs.findMany({
    where: {
      sub_batch_id: subBatchId,
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

  // Group worker logs by department_id for efficient lookup
  const workerLogsByDepartment = new Map<number, typeof allWorkerLogs>();
  for (const log of allWorkerLogs) {
    if (log.department_id) {
      const existing = workerLogsByDepartment.get(log.department_id) || [];
      existing.push(log);
      workerLogsByDepartment.set(log.department_id, existing);
    }
  }

  // Map department entries with their pre-fetched worker logs
  const departmentDetails = completedDepartments.map((deptEntry) => {
    const workerLogs = deptEntry.department_id
      ? workerLogsByDepartment.get(deptEntry.department_id) || []
      : [];

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
  });

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

// ==================== NEW WORKFLOW FUNCTIONS ====================

/**
 * Create initial parent card when sub-batch arrives at a department
 * This is called automatically when a sub-batch enters a department
 */
export const createParentCard = async (
  subBatchId: number,
  departmentId: number,
  quantity: number,
  sentFromDepartmentId?: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify sub-batch exists
    const subBatch = await tx.sub_batches.findUnique({
      where: { id: subBatchId },
    });

    if (!subBatch) {
      throw new Error(`Sub-batch ${subBatchId} not found`);
    }

    // 2. Verify department exists
    const department = await tx.departments.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error(`Department ${departmentId} not found`);
    }

    // 3. Check if parent already exists for this sub-batch in this department
    const existingParent = await tx.department_sub_batches.findFirst({
      where: {
        sub_batch_id: subBatchId,
        department_id: departmentId,
        is_parent: true,
        is_current: true,
      },
    });

    if (existingParent) {
      throw new Error(
        `Parent card already exists for sub-batch ${subBatchId} in department ${departmentId}`
      );
    }

    // 4. Validate quantity
    if (quantity <= 0) {
      throw new Error(`Quantity must be greater than 0 (received: ${quantity})`);
    }

    // 5. Create parent card
    const parent = await tx.department_sub_batches.create({
      data: {
        sub_batch_id: subBatchId,
        department_id: departmentId,
        is_current: true,
        is_parent: true,
        is_dual: false,
        is_forwarded: false,
        stage: 'NEW_ARRIVAL',
        total_quantity: subBatch.estimated_pieces,
        sent_from_department: sentFromDepartmentId,

        // Parent fields
        quantity_received: quantity,
        quantity_remaining: quantity,
        parent_worked: 0,
        parent_altered: 0,

        remarks: sentFromDepartmentId
          ? 'Received from previous department'
          : 'Initial arrival',
      },
      include: {
        department: true,
        sub_batch: true,
      },
    });

    // 6. Create history entry
    await tx.department_sub_batch_history.create({
      data: {
        department_sub_batch_id: parent.id,
        sub_batch_id: subBatchId,
        to_stage: 'NEW_ARRIVAL',
        from_department_id: sentFromDepartmentId,
        to_department_id: departmentId,
        reason: sentFromDepartmentId
          ? 'Forwarded from previous department'
          : 'Initial sub-batch arrival',
      },
    });

    return parent;
  });
};

/**
 * Assign pieces from parent to worker (creates child assignment)
 * This implements the new parent-child-dual workflow
 */
export const assignPiecesToWorker = async (
  parentId: number,
  workerId: number,
  assignedQty: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Load and validate parent
    const parent = await tx.department_sub_batches.findUnique({
      where: { id: parentId },
      include: {
        child_cards: {
          where: { is_current: true, is_forwarded: false },
        },
      },
    });

    if (!parent) {
      throw new Error(`Parent card ${parentId} not found`);
    }

    if (!parent.is_parent) {
      throw new Error(`Card ${parentId} is not a parent card`);
    }

    if (!parent.quantity_remaining || parent.quantity_remaining < assignedQty) {
      throw new Error(
        `Insufficient quantity. Available: ${parent.quantity_remaining}, requested: ${assignedQty}`
      );
    }

    // 2. Verify worker exists
    const worker = await tx.workers.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    // 3. Create child assignment
    const child = await tx.department_sub_batches.create({
      data: {
        sub_batch_id: parent.sub_batch_id!,
        department_id: parent.department_id!,
        assigned_worker_id: workerId,
        parent_department_sub_batch_id: parentId,
        is_current: true,
        is_parent: false,
        is_dual: false,
        is_forwarded: false,
        stage: parent.stage,
        total_quantity: parent.total_quantity,
        sent_from_department: parent.sent_from_department,

        // Child fields
        child_received: assignedQty,
        child_worked: 0,
        child_altered: 0,
        child_remaining: assignedQty,

        remarks: 'Assigned',
      },
      include: {
        assigned_worker: true,
        department: true,
        sub_batch: true,
      },
    });

    // 4. Update parent remaining
    const newParentRemaining = parent.quantity_remaining - assignedQty;

    await tx.department_sub_batches.update({
      where: { id: parentId },
      data: {
        quantity_remaining: newParentRemaining,
      },
    });

    // 5. Check if parent remaining is now 0 (last assignment)
    if (newParentRemaining === 0) {
      // Mark this child as dual
      await tx.department_sub_batches.update({
        where: { id: child.id },
        data: {
          is_dual: true,
        },
      });

      return await tx.department_sub_batches.findUnique({
        where: { id: child.id },
        include: {
          assigned_worker: true,
          department: true,
          sub_batch: true,
          parent_card: true, // Include parent info for dual card
        },
      });
    }

    return child;
  });
};

/**
 * Update child work (worked and altered pieces)
 * Recalculates parent totals
 */
export const updateChildWork = async (
  childId: number,
  newWorked: number,
  newAltered: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Load child
    const child = await tx.department_sub_batches.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new Error(`Child card ${childId} not found`);
    }

    if (child.is_parent) {
      throw new Error(`Card ${childId} is a parent card, not a child`);
    }

    if (child.is_forwarded) {
      throw new Error(`Cannot update work for forwarded child ${childId}`);
    }

    if (!child.child_received) {
      throw new Error(`Child card ${childId} has no received quantity`);
    }

    // 2. Validate: worked + altered <= received
    if (newWorked + newAltered > child.child_received) {
      throw new Error(
        `Invalid quantities. worked (${newWorked}) + altered (${newAltered}) > received (${child.child_received})`
      );
    }

    // 3. Update child
    const childRemaining = child.child_received - (newWorked + newAltered);

    await tx.department_sub_batches.update({
      where: { id: childId },
      data: {
        child_worked: newWorked,
        child_altered: newAltered,
        child_remaining: childRemaining,
      },
    });

    // 4. Recalculate parent totals (includes ALL children, even forwarded)
    // This represents total work done in this department
    if (child.parent_department_sub_batch_id) {
      const allChildren = await tx.department_sub_batches.findMany({
        where: {
          parent_department_sub_batch_id: child.parent_department_sub_batch_id,
          is_current: true,
          // Note: is_forwarded NOT filtered - we include forwarded children
          // Parent totals represent TOTAL work done in this department
        },
      });

      const parentWorked = allChildren.reduce((sum, c) => sum + (c.child_worked || 0), 0);
      const parentAltered = allChildren.reduce((sum, c) => sum + (c.child_altered || 0), 0);

      await tx.department_sub_batches.update({
        where: { id: child.parent_department_sub_batch_id },
        data: {
          parent_worked: parentWorked,
          parent_altered: parentAltered,
        },
      });
    }

    // 5. Return updated child
    return await tx.department_sub_batches.findUnique({
      where: { id: childId },
      include: {
        assigned_worker: true,
        department: true,
        sub_batch: true,
        parent_card: true,
      },
    });
  });
};

/**
 * Forward child to next department
 * Creates new parent in target department
 */
export const forwardChild = async (childId: number, targetDeptId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Load child
    const child = await tx.department_sub_batches.findUnique({
      where: { id: childId },
      include: {
        parent_card: true,
      },
    });

    if (!child) {
      throw new Error(`Child card ${childId} not found`);
    }

    if (child.is_parent) {
      throw new Error(`Card ${childId} is a parent card, cannot forward`);
    }

    if (child.is_forwarded) {
      throw new Error(`Child ${childId} is already forwarded`);
    }

    if (child.child_remaining !== 0) {
      throw new Error(
        `Cannot forward child ${childId}. Remaining quantity must be 0 (current: ${child.child_remaining})`
      );
    }

    if (!child.child_received) {
      throw new Error(`Child ${childId} has no received quantity`);
    }

    // 2. Verify target department exists
    const targetDept = await tx.departments.findUnique({
      where: { id: targetDeptId },
    });

    if (!targetDept) {
      throw new Error(`Department ${targetDeptId} not found`);
    }

    // 3. Create new parent in target department
    const newParent = await tx.department_sub_batches.create({
      data: {
        sub_batch_id: child.sub_batch_id!,
        department_id: targetDeptId,
        is_current: true,
        is_parent: true,
        is_dual: false,
        is_forwarded: false,
        stage: 'NEW_ARRIVAL',
        total_quantity: child.total_quantity,
        sent_from_department: child.department_id,

        // Parent fields
        quantity_received: child.child_received,
        quantity_remaining: child.child_received,
        parent_worked: 0,
        parent_altered: 0,

        remarks: 'Received from forward',
      },
      include: {
        department: true,
        sub_batch: true,
      },
    });

    // 4. Mark child as forwarded
    await tx.department_sub_batches.update({
      where: { id: childId },
      data: {
        is_forwarded: true,
        forwarded_at: new Date(),
        sent_to_department_id: targetDeptId,
      },
    });

    // 5. If child was dual, mark parent as completed/archived
    if (child.is_dual && child.parent_department_sub_batch_id) {
      await tx.department_sub_batches.update({
        where: { id: child.parent_department_sub_batch_id },
        data: {
          is_current: false,
          stage: 'COMPLETED',
        },
      });
    }

    // 6. Create history entry
    await tx.department_sub_batch_history.create({
      data: {
        department_sub_batch_id: newParent.id,
        sub_batch_id: child.sub_batch_id,
        to_stage: 'NEW_ARRIVAL',
        from_department_id: child.department_id,
        to_department_id: targetDeptId,
        reason: 'Forwarded from completed work',
      },
    });

    return newParent;
  });
};

/**
 * Delete child and restore parent quantities
 */
export const deleteChild = async (childId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Load child
    const child = await tx.department_sub_batches.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new Error(`Child card ${childId} not found`);
    }

    if (child.is_parent) {
      throw new Error(`Card ${childId} is a parent card, cannot delete as child`);
    }

    if (child.is_forwarded) {
      throw new Error(`Cannot delete forwarded child ${childId}`);
    }

    if (!child.parent_department_sub_batch_id) {
      throw new Error(`Child ${childId} has no parent card`);
    }

    // 2. Load parent
    const parent = await tx.department_sub_batches.findUnique({
      where: { id: child.parent_department_sub_batch_id },
    });

    if (!parent) {
      throw new Error(`Parent card ${child.parent_department_sub_batch_id} not found`);
    }

    // 3. Restore parent quantities
    await tx.department_sub_batches.update({
      where: { id: child.parent_department_sub_batch_id },
      data: {
        quantity_remaining: {
          increment: child.child_received || 0,
        },
        parent_worked: {
          decrement: child.child_worked || 0,
        },
        parent_altered: {
          decrement: child.child_altered || 0,
        },
      },
    });

    // 4. If child was dual, restore parent visibility
    if (child.is_dual) {
      await tx.department_sub_batches.update({
        where: { id: child.parent_department_sub_batch_id },
        data: {
          is_current: true,
        },
      });
    }

    // 5. Delete child
    await tx.department_sub_batches.delete({
      where: { id: childId },
    });

    // 6. Return updated parent
    return await tx.department_sub_batches.findUnique({
      where: { id: child.parent_department_sub_batch_id },
      include: {
        department: true,
        sub_batch: true,
        child_cards: {
          where: { is_current: true, is_forwarded: false },
          include: {
            assigned_worker: true,
          },
        },
      },
    });
  });
};

/**
 * Get all cards (parent and children) for a department/sub-batch
 */
export const getDepartmentCards = async (
  departmentId: number,
  subBatchId: number
) => {
  // Get parent card
  const parent = await prisma.department_sub_batches.findFirst({
    where: {
      department_id: departmentId,
      sub_batch_id: subBatchId,
      is_parent: true,
      is_current: true,
    },
    include: {
      department: true,
      sub_batch: true,
    },
  });

  // Get all children (non-forwarded)
  const children = await prisma.department_sub_batches.findMany({
    where: {
      department_id: departmentId,
      sub_batch_id: subBatchId,
      is_parent: false,
      is_current: true,
      is_forwarded: false,
    },
    include: {
      assigned_worker: true,
      department: true,
      sub_batch: true,
      parent_card: true, // For dual card to show parent summary
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return {
    parent,
    children,
  };
};
