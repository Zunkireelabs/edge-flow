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
  // 1️⃣ Find the active department_sub_batch entry for this sub-batch and department
  let departmentSubBatchId: number | null = null;

  if (data.department_id) {
    const activeDeptSubBatch = await prisma.department_sub_batches.findFirst({
      where: {
        sub_batch_id: data.sub_batch_id,
        department_id: data.department_id,
        is_current: true,  // Only get active entries
      },
      orderBy: {
        createdAt: 'desc',  // Get the most recent one if multiple exist
      },
    });

    departmentSubBatchId = activeDeptSubBatch?.id ?? null;
  }

  // 2️⃣ Create main worker log with department_sub_batch_id
  const log = await prisma.worker_logs.create({
    data: {
      worker_id: data.worker_id,
      sub_batch_id: data.sub_batch_id,
      department_id: data.department_id,
      department_sub_batch_id: departmentSubBatchId,  // ✅ Automatically link to department sub-batch
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

  // 2️⃣ Handle rejected entries (if any)
  if (data.rejected && data.rejected.length > 0) {
    for (const r of data.rejected) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

        // Create new department_sub_batches for rejected pieces
        const newDept = await tx.department_sub_batches.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            department_id: r.sent_to_department_id,
            stage: DepartmentStage.NEW_ARRIVAL,
            is_current: true,
            quantity_remaining: r.quantity,
            total_quantity: sourceEntry.total_quantity, // Copy the original total quantity
            remarks: "Rejected",
            reject_reason: r.reason, // ✅ Store reject reason
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
      });
    }
  }

  // 3️⃣ Handle altered entries (if any)
  if (data.altered && data.altered.length > 0) {
    for (const a of data.altered) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

        // Create department_sub_batches for altered pieces
        const newDept = await tx.department_sub_batches.create({
          data: {
            sub_batch_id: data.sub_batch_id,
            department_id: a.sent_to_department_id,
            stage: DepartmentStage.NEW_ARRIVAL,
            is_current: true,
            quantity_remaining: a.quantity,
            total_quantity: sourceEntry.total_quantity, // Copy the original total quantity
            remarks: "Altered",
            alter_reason: a.reason, // ✅ Store alter reason
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
      });
    }
  }

  // 4️⃣ Fetch and return the full worker log including rejected/altered
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

/// ✅ Update Worker Log (with optional rejected/altered updates)
export const updateWorkerLog = async (id: number, data: WorkerLogInput) => {
  // Find the active department_sub_batch entry if department_id is being updated
  let departmentSubBatchId: number | null | undefined = undefined;

  if (data.department_id !== undefined) {
    const activeDeptSubBatch = await prisma.department_sub_batches.findFirst({
      where: {
        sub_batch_id: data.sub_batch_id,
        department_id: data.department_id,
        is_current: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    departmentSubBatchId = activeDeptSubBatch?.id ?? null;
  }

  return await prisma.worker_logs.update({
    where: { id },
    data: {
      worker_id: data.worker_id,
      sub_batch_id: data.sub_batch_id,
      department_id: data.department_id,
      department_sub_batch_id: departmentSubBatchId,  // ✅ Update department sub-batch link
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
      department_sub_batch: true,  // ✅ Include department sub-batch relation
      rejected_entry: true,
      altered_entry: true,
    },
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
      },
    });

    if (!workerLog) {
      throw new Error(`Worker log ${id} not found`);
    }

    console.log(`=== Deleting Worker Log ${id} ===`);
    console.log(`Rejected entries: ${workerLog.rejected_entry?.length || 0}`);
    console.log(`Altered entries: ${workerLog.altered_entry?.length || 0}`);

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
    return await tx.worker_logs.delete({
      where: { id },
      include: {
        rejected_entry: true,
        altered_entry: true,
      },
    });
  });
};

/// ✅ Get Worker Logs by Sub-Batch (with rejected/altered)
export const getWorkerLogsBySubBatch = async (sub_batch_id: number) => {
  return await prisma.worker_logs.findMany({
    where: { sub_batch_id },
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
