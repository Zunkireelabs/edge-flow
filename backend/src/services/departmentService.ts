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
export async function getSubBatchesByDepartment(supervisorId: number) {
  // Step 1: Get the department for this supervisor
  const department = await prisma.departments.findFirst({
    where: { supervisor: { id: supervisorId } },
  });

  if (!department) {
    throw new Error("Supervisor is not assigned to any department");
  }

  // Step 2: Fetch sub-batches for this department
  const subs = await prisma.department_sub_batches.findMany({
    where: {
      department_id: department.id,
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
    },
  });

  // Step 3: Return in Kanban style
  return {
    newArrival: subs.filter((s) => s.stage === "NEW_ARRIVAL"),
    inProgress: subs.filter((s) => s.stage === "IN_PROGRESS"),
    completed: subs.filter((s) => s.stage === "COMPLETED"),
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