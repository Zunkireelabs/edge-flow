import prisma from "../config/db";

interface DepartmentPayload {
  name: string;
  supervisor: string;
  remarks?: string;

  sub_batches?: { id: number }[];
  workers?: { id: number }[];
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
    supervisor: data.supervisor,
    remarks: data.remarks,
    ...(data.sub_batches?.length
      ? {
          sub_batches: {
            connect: data.sub_batches.map((sb) => ({ id: sb.id })),
          },
        }
      : {}),
    ...(data.workers?.length
      ? { workers: { connect: data.workers.map((w) => ({ id: w.id })) } }
      : {}),
  };

  return await prisma.departments.create({
    data: deptData,
    include: departmentInclude,
  });
};

export const getAllDepartments = async () => {
  return await prisma.departments.findMany({
    include: departmentInclude,
  });
};

export const getDepartmentById = async (id: number) => {
  const department = await prisma.departments.findUnique({
    where: { id },
    include: departmentInclude,
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
    supervisor: data.supervisor,
    remarks: data.remarks,
  };

  if (data.sub_batches !== undefined) {
    updateData.sub_batches = data.sub_batches.length
      ? { set: data.sub_batches.map((sb) => ({ id: sb.id })) }
      : { set: [] };
  }

  if (data.workers !== undefined) {
    updateData.workers = data.workers.length
      ? { set: data.workers.map((w) => ({ id: w.id })) }
      : { set: [] };
  }

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
