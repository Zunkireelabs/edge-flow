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