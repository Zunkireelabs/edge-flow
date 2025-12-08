import prisma from "../config/db";

interface DepartmentPayload {
  name: string;
  supervisorId: number;
  remarks?: string;

  sub_batches?: { id: number }[];
  workers?: { id: number; assignedDate?: string }[];
}

const departmentInclude = {
  sub_batches: {
    include: {
      size_details: true,
      attachments: true,
      rejected: true,
      altered: true,
      dept_links: true,
      worker_logs: true,
      roll: true,
      batch: true,
      department: true,
    },
  },
  workers: true,
  dept_workers: true,
  dept_batches: true,
  rejected: true,
  altered: true,
};

export const createDepartment = async (data: DepartmentPayload) => {
  const deptData: any = {
    name: data.name,
    remarks: data.remarks,
    ...(data.sub_batches?.length
      ? {
          sub_batches: {
            connect: data.sub_batches.map((sb) => ({ id: sb.id })),
          },
        }
      : {}),
    ...(data.workers?.length
      ? {
          dept_workers: {
            create: data.workers.map((w) => ({
              worker_id: w.id,
              assigned_date: w.assignedDate
                ? new Date(w.assignedDate)
                : new Date(),
            })),
          },
        }
      : {}),
    ...(data.supervisorId
      ? { supervisor: { connect: { id: data.supervisorId } } }
      : {}), // <-- link supervisor if ID is provided
  };

  return await prisma.departments.create({
    data: deptData,
    include: departmentInclude,
  });
};


export const getAllDepartments = async () => {
  return await prisma.departments.findMany({
    include: {
      supervisor: true, // fetch supervisor linked to department
      sub_batches: {
        include: {
          attachments: true, // fetch attachments inside each sub_batch
          size_details: true, // fetch size details of each sub_batch
        },
      },
      workers: true, // fetch all workers in department
      dept_workers: {
        include: {
          worker: true, // also fetch worker info linked
        },
      },
      dept_batches: true, // fetch department_batches
      rejected: true, // rejected sub-batches linked
      altered: true, // altered sub-batches linked
      workflow_steps: true, // workflow steps of this department
      sub_batch_steps: true, // sub-batch workflow steps linked
    },
  });
};

export const getDepartmentById = async (id: number) => {
  const department = await prisma.departments.findUnique({
    where: { id },
    include: {
      supervisor: true,
      sub_batches: {
        include: {
          attachments: true,
          size_details: true,
        },
      },
      workers: true,
      dept_workers: {
        include: { worker: true },
      },
      dept_batches: true,
      rejected: true,
      altered: true,
      workflow_steps: true,
      sub_batch_steps: true,
    },
  });

  if (!department) throw new Error("Department not found");
  return department;
};

export const updateDepartment = async (
  id: number,
  data: Partial<DepartmentPayload>
) => {
  const updateData: any = {
    name: data.name,
    remarks: data.remarks,
    ...(data.sub_batches !== undefined
      ? data.sub_batches.length
        ? {
            sub_batches: { set: data.sub_batches.map((sb) => ({ id: sb.id })) },
          }
        : { sub_batches: { set: [] } } // clear all if empty
      : {}),
    ...(data.workers !== undefined
      ? data.workers.length
        ? {
            dept_workers: {
              deleteMany: {}, // remove old links
              create: data.workers.map((w) => ({
                worker_id: w.id,
                assigned_date: w.assignedDate
                  ? new Date(w.assignedDate)
                  : new Date(),
              })),
            },
          }
        : { dept_workers: { deleteMany: {} } } // clear all if empty
      : {}),
    ...(data.supervisorId
      ? { supervisor: { connect: { id: data.supervisorId } } }
      : {}), // connect supervisor if ID provided
  };

  return await prisma.departments.update({
    where: { id },
    data: updateData,
    include: departmentInclude,
  });
};

export const deleteDepartment = async (id: number) => {
  return await prisma.departments.delete({
    where: { id },
    include: departmentInclude,
  });
};

// Get sub-batches by department (for supervisor's assigned department)
export async function getSubBatchesByDepartment(departmentId: number) {
  // Step 1: Validate department exists
  const department = await prisma.departments.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Step 2: Fetch sub-batches for this department
  const subs = await prisma.department_sub_batches.findMany({
    where: {
      department_id: departmentId,
      is_current: true,
    },
    include: {
      sub_batch: {
        include: {
          size_details: true,
          attachments: true,
          batch: true,
        },
      },
      assigned_worker: true,
      department: true,
      sent_to_department: true, // ✅ Include department this card was sent to
      worker_logs: {
        include: {
          worker: true,  // ✅ Include worker who performed the work
        },
        orderBy: {
          work_date: 'desc',  // Most recent logs first
        },
      },
      // ✅ Include alteration source data (for ALTERED cards)
      altered_created: {
        include: {
          source_entry: {
            include: {
              department: true, // Get the source department (where alteration happened)
            },
          },
          sent_to_department: true, // Department where altered items went
        },
      },
      // ✅ Include rejection source data (for REJECTED cards)
      rejected_created: {
        include: {
          source_entry: {
            include: {
              department: true, // Get the source department (where rejection happened)
            },
          },
          sent_to_department: true, // Department where rejected items went (always null for waste)
        },
      },
      // ✅ Include altered/rejected entries FROM this department_sub_batch (for Kanban card display)
      altered_source: true,  // sub_batch_altered where source_department_sub_batch_id = this.id
      rejected_source: true, // sub_batch_rejected where source_department_sub_batch_id = this.id
    },
  });

  // Step 3: Enrich data with source department names for ALTERED/REJECTED cards
  const enrichedSubs = await Promise.all(
    subs.map(async (sub) => {
      // Initialize alteration_source and rejection_source
      let alteration_source = null;
      let rejection_source = null;

      // For cards that originated from alteration - populate alteration_source
      // Check multiple indicators since rework cards can be forwarded to other departments:
      // 1. altered_created - direct alteration record (original alteration card)
      // 2. alter_reason - set when card originated from alteration (persists across forwards)
      if (sub.altered_created && sub.altered_created.length > 0) {
        const alteredRecord = sub.altered_created[0];
        const sourceDept = alteredRecord.source_entry?.department;

        alteration_source = {
          from_department_id: sourceDept?.id || sub.sent_from_department,
          from_department_name: sourceDept?.name || null,
          quantity: alteredRecord.quantity,
          reason: alteredRecord.reason || sub.alter_reason,
          created_at: sub.createdAt,
        };
      } else if (sub.alter_reason) {
        // Card was forwarded from a rework - alter_reason persists but altered_created doesn't
        // This handles cases where rework card is sent to next department (e.g., Dep-1 -> Dep-2)
        // Fetch the department name since we only have the ID
        let fromDeptName = null;
        if (sub.sent_from_department) {
          const fromDept = await prisma.departments.findUnique({
            where: { id: sub.sent_from_department },
            select: { name: true },
          });
          fromDeptName = fromDept?.name || null;
        }

        alteration_source = {
          from_department_id: sub.sent_from_department || null,
          from_department_name: fromDeptName,
          quantity: sub.quantity_received || sub.total_quantity,
          reason: sub.alter_reason,
          created_at: sub.createdAt,
        };
      }

      // For cards that originated from rejection - populate rejection_source
      // Check multiple indicators since rejection cards can be forwarded:
      // 1. rejected_created - direct rejection record (original rejection card)
      // 2. reject_reason - set when card originated from rejection (persists across forwards)
      if (sub.rejected_created && sub.rejected_created.length > 0) {
        const rejectedRecord = sub.rejected_created[0];
        const sourceDept = rejectedRecord.source_entry?.department;

        rejection_source = {
          from_department_id: sourceDept?.id || sub.sent_from_department,
          from_department_name: sourceDept?.name || null,
          quantity: rejectedRecord.quantity,
          reason: rejectedRecord.reason || sub.reject_reason,
          created_at: sub.createdAt,
        };
      } else if (sub.reject_reason) {
        // Card was forwarded from a rejection - reject_reason persists but rejected_created doesn't
        // Fetch the department name since we only have the ID
        let fromDeptName = null;
        if (sub.sent_from_department) {
          const fromDept = await prisma.departments.findUnique({
            where: { id: sub.sent_from_department },
            select: { name: true },
          });
          fromDeptName = fromDept?.name || null;
        }

        rejection_source = {
          from_department_id: sub.sent_from_department || null,
          from_department_name: fromDeptName,
          quantity: sub.quantity_received || sub.total_quantity,
          reason: sub.reject_reason,
          created_at: sub.createdAt,
        };
      }

      // If sent_from_department exists but no alteration/rejection source, fetch department name
      let sent_from_dept_name = null;
      if (sub.sent_from_department && !alteration_source && !rejection_source) {
        const dept = await prisma.departments.findUnique({
          where: { id: sub.sent_from_department },
          select: { name: true },
        });
        sent_from_dept_name = dept?.name || null;
      }

      // ✅ Calculate total altered and rejected FROM this department_sub_batch
      const totalAltered = (sub as any).altered_source?.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0) || 0;
      const totalRejected = (sub as any).rejected_source?.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0) || 0;

      return {
        ...sub,
        alteration_source,
        rejection_source,
        sent_from_department_name: sent_from_dept_name,
        // ✅ NEW: Totals for Kanban card display
        total_altered: totalAltered,
        total_rejected: totalRejected,
      };
    })
  );

  // Step 4: Return in Kanban style with enriched data
  return {
    newArrival: enrichedSubs.filter((s) => s.stage === "NEW_ARRIVAL"),
    inProgress: enrichedSubs.filter((s) => s.stage === "IN_PROGRESS"),
    completed: enrichedSubs.filter((s) => s.stage === "COMPLETED"),
  };
}

 // Remove worker from department
export const removeWorkerFromDepartment = async (
  departmentId: number,
  workerId: number
) => {
  // Delete the link from department_workers
  return await prisma.department_workers.deleteMany({
    where: {
      department_id: departmentId,
      worker_id: workerId,
    },
  });
};


// Get All the Sub-batches that are sent to production
export const getProductionSubBatches = async (productionDeptId: number) => {
  return await prisma.department_sub_batches.findMany({
    where: {
      department_id: productionDeptId,
    },
    include: {
      sub_batch: {
        include: {
          size_details: true,
          attachments: true,
          batch: true,
        },
      },
      department: true,
    },
  });
};