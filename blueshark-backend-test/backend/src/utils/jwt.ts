import jwt from "jsonwebtoken";

export type UserRole = "ADMIN" | "SUPERVISOR" | "SUPER_SUPERVISOR";

export const generateToken = (
  userId: number,
  role: UserRole,
  departmentId?: number | null
) => {
  return jwt.sign({ userId, role, departmentId }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
    role: UserRole;
    departmentId?: number | null;
  };
};
