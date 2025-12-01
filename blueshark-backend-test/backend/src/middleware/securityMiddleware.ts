// src/middleware/securityMiddleware.ts
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

// Helmet configuration for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disabled for API compatibility
});

// General API rate limiter - 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    retryAfter: 60,
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});

// Stricter rate limiter for auth routes - 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes.",
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const { method, url, ip } = req;

  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${url} - Started`);

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? "ERROR" : "INFO";
    console.log(
      `[${new Date().toISOString()}] [${logLevel}] ${method} ${url} - ${statusCode} (${duration}ms) - IP: ${ip}`
    );
  });

  next();
};

// Sanitize request body - remove potentially dangerous characters
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query as Record<string, unknown>);
  }
  next();
};

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Remove null bytes and trim whitespace
      obj[key] = (obj[key] as string).replace(/\0/g, "").trim();
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}
