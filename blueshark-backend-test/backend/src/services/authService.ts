import prisma from "../config/db";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

// Admin Signup
export const signupUser = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "ADMIN", // added role here
    },
  });

  const token = generateToken(user.id, "ADMIN");

  return { user: { ...user, role: "ADMIN" }, token };
};

// Admin Login
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = generateToken(user.id, "ADMIN");

  return { user: { ...user, role: user.role as "ADMIN" }, token };
};

// Supervisor Login (handles both SUPERVISOR and SUPER_SUPERVISOR)
export const loginSupervisor = async (email: string, password: string) => {
  const supervisor = await prisma.supervisor.findUnique({ where: { email } });
  if (!supervisor) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, supervisor.password);
  if (!isMatch) throw new Error("Invalid email or password");

  // Use actual role from database (SUPERVISOR or SUPER_SUPERVISOR)
  const role = supervisor.role as "SUPERVISOR" | "SUPER_SUPERVISOR";

  const token = generateToken(
    supervisor.id,
    role,
    supervisor.departmentId ?? null  // null for SUPER_SUPERVISOR
  );

  return { supervisor: { ...supervisor, role }, token };
};
