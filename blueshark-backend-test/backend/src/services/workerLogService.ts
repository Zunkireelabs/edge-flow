// src/services/workerLogService.ts
import prisma, { Prisma } from "../config/db";

export enum DepartmentStage {
  NEW_ARRIVAL = "NEW_ARRIVAL",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum WorkerActivityType {
  NORMAL = "NORMAL",
  REJECTED = "REJECTED",
  ALTERED = "ALTERED",
}

interface RejectedInput {
  quantity: number;
  sent_to_department_id: number;
  source_department_sub_batch_id: number; // Specific entry to reduce from
  reason: string;
}

interface AlteredInput {
  quantity: number;
  sent_to_department_id: number;
  source_department_sub_batch_id: number; // Specific entry to reduce from
  reason: string;
}

export interface WorkerLogInput {
  worker_id: number;
  sub_batch_id: number;
  department_id?: number;
  worker_name?: string;
  work_date?: string;
  size_category?: string;
  particulars?: string;
  quantity_received?: number;
  quantity_worked?: number;
  unit_price?: number;
  activity_type?: WorkerActivityType;
  is_billable?: boolean;
  rejected?: RejectedInput[];
  altered?: AlteredInput[];
}

/// ✅ Create Worker Log with optional rejected/altered
export const createWorkerLog = async (data: WorkerLogInput) => {
  const logId = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Find the active department_sub_batch entry for this sub-batch and department
    let departmentSubBatchId: number | null = null;
    let newDeptSubBatchId: number | null = null;

    if (data.department_id && data.quantity_worked && data.quantity_worked > 0) {
      // Find active department_sub_batch entry for this sub-batch and department
      const activeDeptSubBatch = await tx.department_sub_batches.findFirst({
        where: {
          sub_batch_id: data.sub_batch_id,
          department_id: data.department_id,
          is_current: true,  // Only get active entries
          quantity_remaining: {
            gte: data.quantity_worked,  // Must have enough pieces
          },
        },
        orderBy: {
          createdAt: 'desc',  // Get the most recent one if multiple exist
        },
      });

      if (!activeDeptSubBatch) {
        throw new Error(
          `Insufficient quantity available. ` +
          `Requested: ${data.quantity_worked} pieces. ` +
          `Please check remaining work.`
        );
      }

      // ✅ FIXED: ALWAYS update existing record, NEVER split for normal assignments
      // Multiple workers can work on same record
      // Note: Use direct set for quantity_assigned if null (increment on null doesn't work)
      const currentAssigned = activeDeptSubBatch.quantity_assigned ?? 0;

      // ✅ Auto-update stage to IN_PROGRESS when first worker is assigned
      // A sub-batch with workers assigned IS "In Progress" by definition
      const shouldUpdateStage = activeDeptSubBatch.stage === DepartmentStage.NEW_ARRIVAL;

      await tx.department_sub_batches.update({
        where: { id: activeDeptSubBatch.id },
        data: {
          quantity_assigned: currentAssigned + data.quantity_worked,  // ✅ Add to existing (handles null)
          quantity_remaining: {
            decrement: data.quantity_worked,  // ✅ Reduce available work
          },
          // ✅ Auto-update stage from NEW_ARRIVAL to IN_PROGRESS on first assignment
          ...(shouldUpdateStage && { stage: DepartmentStage.IN_PROGRESS }),
          // ✅ Don't update assigned_worker_id - multiple workers can be assigned
          remarks: "Assigned",
        },
      });

      departmentSubBatchId = activeDeptSubBatch.id;
    }

    // 4️⃣ Create main worker log with department_sub_batch_id
    const log = await tx.worker_logs.create({
      data: {
        worker_id: data.worker_id,
        sub_batch_id: data.sub_batch_id,
        department_id: data.department_id,
        department_sub_batch_id: departmentSubBatchId,  // ✅ Link to the new split sub-batch
        worker_name: data.worker_name,
        work_date: data.work_date ? new Date(data.work_date) : undefined,
        size_category: data.size_category,
        particulars: data.particulars,
        quantity_received: data.quantity_received,
        quantity_worked: data.quantity_worked,
        unit_price: data.unit_price,
        activity_type: data.activity_type ?? "NORMAL",
        is_billable: data.is_billable ?? true,
      },
    });

    const logId = log.id;

    // 5️⃣ Handle rejected entries (if any)
    if (data.rejected && data.rejected.length > 0) {
      for (const r of data.rejected) {
        // Verify source entry exists and has sufficient quantity
        const sourceEntry = await tx.department_sub_batches.findUnique({
          where: { id: r.source_department_sub_batch_id },
        });

        if (!sourceEntry) {
          throw new Error(`Source department_sub_batch entry ${r.source_department_sub_batch_id} not found`);
        }

        if (!sourceEntry.is_current) {
          throw new Error(`Source entry ${r.source_department_sub_batch_id} is not active`);
        }

        if ((sourceEntry.quantity_remaining || 0) < r.quantity) {
          throw new Error(`Insufficient quantity in source entry. Available: ${sourceEntry.quantity_remaining}, requested: ${r.quantity}`);
        }

        // Reduce quantity from SPECIFIC entry (not all entries)
        await tx.department_sub_batches.update({
          where: {
            id: r.source_department_sub_batch_id,
          },
          data: {
            quantity_remaining: { decrement: r.quantity },
          },
        });

        // Create new department_sub_batches for rejected pieces (this becomes the new Main card in target department)
        const newDept = await tx.department_sub_batches.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            department_id: r.sent_to_department_id,
            parent_department_sub_batch_id: null, // ✅ New Main card has no parent in the new department
            stage: DepartmentStage.NEW_ARRIVAL,
            is_current: true,
            quantity_remaining: r.quantity,
            quantity_received: r.quantity,
            total_quantity: sourceEntry.total_quantity, // Copy the original total quantity
            remarks: "Rejected",
            reject_reason: r.reason, // ✅ Store reject reason
            sent_from_department: sourceEntry.department_id, // ✅ Track which department it came from
          },
        });

        // Create rejected record with BOTH source and created IDs
        const rejectedRecord = await tx.sub_batch_rejected.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            quantity: r.quantity,
            sent_to_department_id: r.sent_to_department_id,
            reason: r.reason,
            worker_log_id: logId,
            source_department_sub_batch_id: r.source_department_sub_batch_id,  // ✅ Store source entry
            created_department_sub_batch_id: newDept.id,                       // ✅ Store created entry
          },
        });

        // Log history
        await tx.department_sub_batch_history.create({
          data: {
            department_sub_batch_id: newDept.id,
            sub_batch_id: data.sub_batch_id,
            to_stage: DepartmentStage.NEW_ARRIVAL,
            to_department_id: r.sent_to_department_id,
            reason: r.reason,
          },
        });
      }
    }

    // 6️⃣ Handle altered entries (if any)
    if (data.altered && data.altered.length > 0) {
      for (const a of data.altered) {
        // Verify source entry exists and has sufficient quantity
        const sourceEntry = await tx.department_sub_batches.findUnique({
          where: { id: a.source_department_sub_batch_id },
        });

        if (!sourceEntry) {
          throw new Error(`Source department_sub_batch entry ${a.source_department_sub_batch_id} not found`);
        }

        if (!sourceEntry.is_current) {
          throw new Error(`Source entry ${a.source_department_sub_batch_id} is not active`);
        }

        if ((sourceEntry.quantity_remaining || 0) < a.quantity) {
          throw new Error(`Insufficient quantity in source entry. Available: ${sourceEntry.quantity_remaining}, requested: ${a.quantity}`);
        }

        // Reduce quantity from SPECIFIC entry (not all entries)
        await tx.department_sub_batches.update({
          where: {
            id: a.source_department_sub_batch_id,
          },
          data: {
            quantity_remaining: { decrement: a.quantity },
          },
        });

        // Create department_sub_batches for altered pieces (this becomes the new Main card in target department)
        const newDept = await tx.department_sub_batches.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            department_id: a.sent_to_department_id,
            parent_department_sub_batch_id: null, // ✅ New Main card has no parent in the new department
            stage: DepartmentStage.NEW_ARRIVAL,
            is_current: true,
            quantity_remaining: a.quantity,
            quantity_received: a.quantity,
            total_quantity: sourceEntry.total_quantity, // Copy the original total quantity
            remarks: "Altered",
            alter_reason: a.reason, // ✅ Store alter reason
            sent_from_department: sourceEntry.department_id, // ✅ Track which department it came from
          },
        });

        // Create altered record with BOTH source and created IDs
        const alteredRecord = await tx.sub_batch_altered.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            quantity: a.quantity,
            sent_to_department_id: a.sent_to_department_id,
            reason: a.reason,
            worker_log_id: logId,
            source_department_sub_batch_id: a.source_department_sub_batch_id,  // ✅ Store source entry
            created_department_sub_batch_id: newDept.id,                       // ✅ Store created entry
          },
        });

        // Log history
        await tx.department_sub_batch_history.create({
          data: {
            department_sub_batch_id: newDept.id,
            sub_batch_id: data.sub_batch_id,
            to_stage: DepartmentStage.NEW_ARRIVAL,
            to_department_id: a.sent_to_department_id,
            reason: a.reason,
          },
        });
      }
    }

    // 7️⃣ Return the log ID to fetch outside transaction
    return logId;
  }, {
    maxWait: 10000, // Maximum time to wait to start transaction (10s)
    timeout: 20000, // Maximum time for transaction to complete (20s)
  });

  // 8️⃣ Fetch and return the full worker log outside of transaction
  return await prisma.worker_logs.findUnique({
    where: { id: logId },
    include: {
      worker: true,
      sub_batch: true,
      departments: true,
      department_sub_batch: true,  // ✅ Include department sub-batch relation
      rejected_entry: true,
      altered_entry: true,
    },
  });
};

/// ✅ Get All Worker Logs (with rejected & altered)
export const getAllWorkerLogs = async () => {
  return await prisma.worker_logs.findMany(
    {
      include: {
        worker: true,
        sub_batch: true,
        departments: true,
        department_sub_batch: true,  // ✅ Include department sub-batch relation
        rejected_entry: true,
        altered_entry: true,
      },
    });
};

/// ✅ Get Worker Log by ID
export const getWorkerLogById = async (id: number) => {
  return await prisma.worker_logs.findUnique({
    where: { id },
    include: {
      worker: true,
      sub_batch: true,
      departments: true,
      department_sub_batch: true,  // ✅ Include department sub-batch relation
      rejected_entry: true,
      altered_entry: true,
    },
  });
};

/// ✅ Update Worker Log (with department_sub_batch updates)
export const updateWorkerLog = async (id: number, data: WorkerLogInput) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ Fetch the existing worker log
    const existingLog = await tx.worker_logs.findUnique({
      where: { id },
      include: {
        department_sub_batch: true,
      },
    });

    if (!existingLog) {
      throw new Error(`Worker log ${id} not found`);
    }

    // 2️⃣ Check if quantity_worked or worker_id changed
    const quantityChanged = data.quantity_worked !== undefined &&
                           data.quantity_worked !== existingLog.quantity_worked;
    const workerChanged = data.worker_id !== undefined &&
                         data.worker_id !== existingLog.worker_id;

    // 3️⃣ If quantity or worker changed, update the department_sub_batch entry
    if ((quantityChanged || workerChanged) && existingLog.department_sub_batch_id) {
      const deptSubBatch = existingLog.department_sub_batch;

      if (deptSubBatch) {
        // Update the department_sub_batch entry
        await tx.department_sub_batches.update({
          where: { id: deptSubBatch.id },
          data: {
            quantity_assigned: data.quantity_worked ?? existingLog.quantity_worked,
            quantity_remaining: data.quantity_worked ?? existingLog.quantity_worked,
            quantity_received: data.quantity_worked ?? existingLog.quantity_worked,
            assigned_worker_id: data.worker_id ?? existingLog.worker_id,
          },
        });
      }
    }

    // 4️⃣ Update the worker log
    return await tx.worker_logs.update({
      where: { id },
      data: {
        worker_id: data.worker_id,
        sub_batch_id: data.sub_batch_id,
        department_id: data.department_id,
        worker_name: data.worker_name,
        work_date: data.work_date ? new Date(data.work_date) : undefined,
        size_category: data.size_category,
        particulars: data.particulars,
        quantity_received: data.quantity_received,
        quantity_worked: data.quantity_worked,
        unit_price: data.unit_price,
        activity_type: data.activity_type,
        is_billable: data.is_billable,
      },
      include: {
        worker: true,
        sub_batch: true,
        departments: true,
        department_sub_batch: true,
        rejected_entry: true,
        altered_entry: true,
      },
    });
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
};

/// ✅ Delete Worker Log (and reverse all reject/alter operations)
export const deleteWorkerLog = async (id: number) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1️⃣ First, fetch the worker log with all related data
    const workerLog = await tx.worker_logs.findUnique({
      where: { id },
      include: {
        rejected_entry: true,
        altered_entry: true,
        department_sub_batch: true,
      },
    });

    if (!workerLog) {
      throw new Error(`Worker log ${id} not found`);
    }

    console.log(`=== Deleting Worker Log ${id} ===`);
    console.log(`Rejected entries: ${workerLog.rejected_entry?.length || 0}`);
    console.log(`Altered entries: ${workerLog.altered_entry?.length || 0}`);
    console.log(`Department sub-batch ID: ${workerLog.department_sub_batch_id}`);

    // 1.5️⃣ Handle the department_sub_batch (reverse quantity changes)
    if (workerLog.department_sub_batch_id && workerLog.quantity_worked) {
      console.log(`\n--- Reversing Assignment ---`);
      console.log(`Department Sub-Batch ID: ${workerLog.department_sub_batch_id}`);
      console.log(`Quantity to restore: ${workerLog.quantity_worked}`);

      // Fetch current values to safely handle nulls
      const deptSubBatch = await tx.department_sub_batches.findUnique({
        where: { id: workerLog.department_sub_batch_id },
      });

      if (deptSubBatch) {
        const currentAssigned = deptSubBatch.quantity_assigned ?? 0;
        const newAssigned = Math.max(0, currentAssigned - workerLog.quantity_worked);

        // ✅ FIXED: Simply reverse the quantity changes on the existing record
        await tx.department_sub_batches.update({
          where: { id: workerLog.department_sub_batch_id },
          data: {
            quantity_assigned: newAssigned,  // ✅ Reduce assigned amount (handles null)
            quantity_remaining: {
              increment: workerLog.quantity_worked,  // ✅ Restore available work
            },
            // ✅ Don't change assigned_worker_id (other workers may still be assigned)
          },
        });

        console.log(`✓ Restored ${workerLog.quantity_worked} pieces to department_sub_batch ${workerLog.department_sub_batch_id}`);
      }
    }

    // 2️⃣ Reverse rejected entries
    if (workerLog.rejected_entry && workerLog.rejected_entry.length > 0) {
      for (const rejectedRecord of workerLog.rejected_entry) {
        console.log(`\n--- Processing Rejected Entry ${rejectedRecord.id} ---`);
        console.log(`Quantity: ${rejectedRecord.quantity}`);
        console.log(`Source entry ID: ${rejectedRecord.source_department_sub_batch_id}`);
        console.log(`Created entry ID: ${rejectedRecord.created_department_sub_batch_id}`);

        // ✅ DELETE the created entry completely (don't just mark inactive)
        if (rejectedRecord.created_department_sub_batch_id) {
          const createdEntry = await tx.department_sub_batches.findUnique({
            where: { id: rejectedRecord.created_department_sub_batch_id },
          });

          if (createdEntry) {
            // DELETE the created rejected entry completely
            await tx.department_sub_batches.delete({
              where: { id: rejectedRecord.created_department_sub_batch_id },
            });
            console.log(`✓ Deleted rejected department entry ${rejectedRecord.created_department_sub_batch_id} completely`);
          } else {
            console.warn(`⚠ Created entry ${rejectedRecord.created_department_sub_batch_id} not found (already deleted?)`);
          }
        }

        // ✅ Use the EXACT source entry ID that was stored
        if (rejectedRecord.source_department_sub_batch_id) {
          const sourceEntry = await tx.department_sub_batches.findUnique({
            where: { id: rejectedRecord.source_department_sub_batch_id },
          });

          if (sourceEntry) {
            // Restore quantity to the EXACT source entry
            await tx.department_sub_batches.update({
              where: { id: rejectedRecord.source_department_sub_batch_id },
              data: {
                quantity_remaining: { increment: rejectedRecord.quantity },
              },
            });
            console.log(`✓ Restored ${rejectedRecord.quantity} to source entry ${rejectedRecord.source_department_sub_batch_id}`);
          } else {
            console.error(`❌ Source entry ${rejectedRecord.source_department_sub_batch_id} not found! Cannot restore quantity.`);
          }
        } else {
          console.error(`❌ No source_department_sub_batch_id stored! Cannot restore quantity precisely.`);
        }

        // Delete the sub_batch_rejected record
        await tx.sub_batch_rejected.delete({
          where: { id: rejectedRecord.id },
        });
        console.log(`✓ Deleted rejected record ${rejectedRecord.id}`);
      }
    }

    // 3️⃣ Reverse altered entries
    if (workerLog.altered_entry && workerLog.altered_entry.length > 0) {
      for (const alteredRecord of workerLog.altered_entry) {
        console.log(`\n--- Processing Altered Entry ${alteredRecord.id} ---`);
        console.log(`Quantity: ${alteredRecord.quantity}`);
        console.log(`Source entry ID: ${alteredRecord.source_department_sub_batch_id}`);
        console.log(`Created entry ID: ${alteredRecord.created_department_sub_batch_id}`);

        // ✅ DELETE the created entry completely (don't just mark inactive)
        if (alteredRecord.created_department_sub_batch_id) {
          const createdEntry = await tx.department_sub_batches.findUnique({
            where: { id: alteredRecord.created_department_sub_batch_id },
          });

          if (createdEntry) {
            // DELETE the created altered entry completely
            await tx.department_sub_batches.delete({
              where: { id: alteredRecord.created_department_sub_batch_id },
            });
            console.log(`✓ Deleted altered department entry ${alteredRecord.created_department_sub_batch_id} completely`);
          } else {
            console.warn(`⚠ Created entry ${alteredRecord.created_department_sub_batch_id} not found (already deleted?)`);
          }
        }

        // ✅ Use the EXACT source entry ID that was stored
        if (alteredRecord.source_department_sub_batch_id) {
          const sourceEntry = await tx.department_sub_batches.findUnique({
            where: { id: alteredRecord.source_department_sub_batch_id },
          });

          if (sourceEntry) {
            // Restore quantity to the EXACT source entry
            await tx.department_sub_batches.update({
              where: { id: alteredRecord.source_department_sub_batch_id },
              data: {
                quantity_remaining: { increment: alteredRecord.quantity },
              },
            });
            console.log(`✓ Restored ${alteredRecord.quantity} to source entry ${alteredRecord.source_department_sub_batch_id}`);
          } else {
            console.error(`❌ Source entry ${alteredRecord.source_department_sub_batch_id} not found! Cannot restore quantity.`);
          }
        } else {
          console.error(`❌ No source_department_sub_batch_id stored! Cannot restore quantity precisely.`);
        }

        // Delete the sub_batch_altered record
        await tx.sub_batch_altered.delete({
          where: { id: alteredRecord.id },
        });
        console.log(`✓ Deleted altered record ${alteredRecord.id}`);
      }
    }

    // 4️⃣ Finally, delete the worker log
    console.log(`\n✓ Deleting worker log ${id}`);
    const deletedLog = await tx.worker_logs.delete({
      where: { id },
      // ✅ FIXED: Removed include - delete() doesn't support it
    });
    console.log(`✓ Worker log ${id} deleted successfully`);
    return deletedLog;
  });
};

/// ✅ Get Worker Logs by Sub-Batch (with rejected/altered)
export const getWorkerLogsBySubBatch = async (
  sub_batch_id: number,
  department_id?: number,
  department_sub_batch_id?: number
) => {
  const whereClause: any = { sub_batch_id };

  // Add optional filters if provided
  if (department_id) {
    whereClause.department_id = department_id;
  }
  if (department_sub_batch_id) {
    whereClause.department_sub_batch_id = department_sub_batch_id;
  }

  return await prisma.worker_logs.findMany({
    where: whereClause,
    include: {
      worker: true,
      sub_batch: true,
      departments: true,
      department_sub_batch: true,  // ✅ Include department sub-batch relation
      rejected_entry: true,
      altered_entry: true,
    },
    orderBy: { work_date: "asc" },
  });
};
