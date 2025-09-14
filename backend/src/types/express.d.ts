// src/types/express.d.ts
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: "ADMIN" | "SUPERVISOR" | string;
    departmentId?: number;
    [key: string]: any;
  };
}
