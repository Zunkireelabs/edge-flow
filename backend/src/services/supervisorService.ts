import prisma from "../config/db";
import bcrypt from "bcrypt";

interface SupervisorUpdatePayload {
  name?: string;
  email?: string;
  newPassword?: string;
}

export async function createSupervisor(data: {
  name: string;
  email: string;
  password: string;
  departmentId?: number; // make it optional
}) {
  const hashed = await bcrypt.hash(data.password, 10);

  const supervisor = await prisma.supervisor.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      // Only connect department if departmentId is provided
      department: data.departmentId
        ? { connect: { id: data.departmentId } }
        : undefined,
    },
    include: { department: true },
  });

  return supervisor;
}

export const assignSupervisorToDepartment = async (
  supervisorId: number,
  departmentId: number
) => {
  return await prisma.supervisor.update({
    where: { id: supervisorId },
    data: { department: { connect: { id: departmentId } } },
    include: { department: true },
  });
};

export const getAllSupervisors = async () => {
  return await prisma.supervisor.findMany({
    include: { department: true }, // so we also see assigned department
  });
};

export const updateSupervisor = async (
  supervisorId: number,
  data: SupervisorUpdatePayload
) => {
  const supervisor = await prisma.supervisor.findUnique({
    where: { id: supervisorId },
  });

  if (!supervisor) {
    throw new Error("Supervisor not found");
  }

  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.newPassword) {
    updateData.password = await bcrypt.hash(data.newPassword, 10);
  }

  return await prisma.supervisor.update({
    where: { id: supervisorId },
    data: updateData,
    select: { id: true, name: true, email: true },
  });
};

  

export const deleteSupervisorService = async (id: number) => {
  return prisma.supervisor.delete({
    where: { id },
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
