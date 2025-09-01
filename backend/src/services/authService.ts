import prisma from "../config/db";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

// Signup service
export const signupUser = async (email: string, password: string) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // Generate JWT token
  const token = generateToken(user.id);

  return { user, token };
};

// Login service
export const loginUser = async (email: string, password: string) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  // 3. Generate JWT token
  const token = generateToken(user.id);

  return { user, token };
};
