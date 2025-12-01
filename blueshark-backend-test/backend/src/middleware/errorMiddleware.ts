// src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from "express";

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const BadRequestError = (message: string) => new ApiError(400, message);
export const UnauthorizedError = (message = "Unauthorized") =>
  new ApiError(401, message);
export const ForbiddenError = (message = "Forbidden") =>
  new ApiError(403, message);
export const NotFoundError = (message = "Resource not found") =>
  new ApiError(404, message);
export const ConflictError = (message: string) => new ApiError(409, message);
export const ValidationError = (message: string) => new ApiError(422, message);
export const InternalError = (message = "Internal server error") =>
  new ApiError(500, message, false);

// Standardized API response format
interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: {
    code: string;
    details?: unknown;
  };
}

// Error handler middleware
export default function errorMiddleware(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`  Path: ${req.method} ${req.path}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(`  Stack: ${err.stack}`);
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      error: {
        code: getErrorCode(err.statusCode),
      },
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as unknown as { code: string; meta?: unknown };
    const { statusCode, message } = handlePrismaError(prismaError.code);
    const response: ApiResponse = {
      success: false,
      message,
      error: {
        code: getErrorCode(statusCode),
        details:
          process.env.NODE_ENV === "development" ? prismaError.meta : undefined,
      },
    };
    return res.status(statusCode).json(response);
  }

  // Handle validation errors from express-validator
  if (err.name === "ValidationError") {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      error: {
        code: "VALIDATION_ERROR",
      },
    };
    return res.status(422).json(response);
  }

  // Default to 500 Internal Server Error
  const response: ApiResponse = {
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    error: {
      code: "INTERNAL_ERROR",
    },
  };
  return res.status(500).json(response);
}

// Map status codes to error codes
function getErrorCode(statusCode: number): string {
  const errorCodes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_ERROR",
  };
  return errorCodes[statusCode] || "UNKNOWN_ERROR";
}

// Handle common Prisma errors
function handlePrismaError(code: string): { statusCode: number; message: string } {
  switch (code) {
    case "P2002":
      return { statusCode: 409, message: "A record with this value already exists" };
    case "P2003":
      return { statusCode: 400, message: "Invalid reference - related record not found" };
    case "P2025":
      return { statusCode: 404, message: "Record not found" };
    case "P2014":
      return { statusCode: 400, message: "Invalid ID provided" };
    default:
      return { statusCode: 500, message: "Database error occurred" };
  }
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response) {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: {
      code: "NOT_FOUND",
    },
  };
  res.status(404).json(response);
}
