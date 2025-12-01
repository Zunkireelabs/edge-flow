import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth";
import dotenv from "dotenv";
import rollRoutes from "./src/routes/roll";
import batchRoutes from "./src/routes/batch";
import subBatchRoutes from "./src/routes/subBatch";
import workerRoutes from "./src/routes/worker";
import vendorRoutes from "./src/routes/vendor";
import categoryRoutes from "./src/routes/category";
import departmentRoutes from "./src/routes/department";
import departmentSubBatchRoutes from "./src/routes/departmentSubBatch";
import supervisorRoutes from "./src/routes/supervisor";
import workerLogRoutes from "./src/routes/workerLog";
import subBatchRejectedRoutes from "./src/routes/subBatchRejected";
import subBatchAlteredRoutes from "./src/routes/subBatchAltered";
import subBatchWorkflowRoutes from "./src/routes/subBatchWorkflow";
import wageRoutes from "./src/routes/wage";
import productionViewRoutes from "./src/routes/productionView";
import inventoryRoutes from "./src/routes/inventory";
import inventorySubtractionRoutes from "./src/routes/inventorySubtraction";
import adminProductionRoutes from "./src/routes/adminProduction";

// Security and error handling middleware
import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  requestLogger,
  sanitizeInput,
} from "./src/middleware/securityMiddleware";
import errorMiddleware, { notFoundHandler } from "./src/middleware/errorMiddleware";

dotenv.config();

const app = express();

// Security middleware (apply first)
app.use(securityHeaders);
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://edge-flow-gamma.vercel.app", "https://edge-flow-git-dev-sthasadins-projects.vercel.app"]
    : "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // Limit request body size
app.use(sanitizeInput);

// Request logging (development only for less noise)
if (process.env.NODE_ENV === "development") {
  app.use(requestLogger);
}

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

import healthRoutes from "./src/routes/health";
app.use("/api/health", healthRoutes);

// Auth routes (with stricter rate limiting)
app.use("/api/auth", authLimiter, authRoutes);

// Supervisor routes
app.use("/api/supervisors", supervisorRoutes);

// Roll routes
app.use("/api/rolls", rollRoutes);

//Batch Routes
app.use("/api/batches", batchRoutes);

//Sub-Batch Routes
app.use("/api/sub-batches", subBatchRoutes);


// Worker Routes
app.use("/api/workers", workerRoutes);

//Vendor Routes
app.use("/api/vendors", vendorRoutes);

//category Routes
app.use("/api/categories", categoryRoutes);

// Department Routes
app.use("/api/departments", departmentRoutes);

// Department Sub-Batch Routes
app.use("/api/department-sub-batches", departmentSubBatchRoutes);

//worker Log Routes
app.use("/api/worker-logs", workerLogRoutes);

// sub-batch rejected and altered routes
app.use("/api/sub-batch-rejected", subBatchRejectedRoutes);
app.use("/api/sub-batch-altered", subBatchAlteredRoutes);

// sub-batch Workflow Routes
app.use("/api/sub-batches/workflow", subBatchWorkflowRoutes);

// Wage Calculation Routes
app.use("/api/wages", wageRoutes);

// Production View Routes
app.use("/api/production-view", productionViewRoutes);

// Inventory Routes
app.use("/api/inventory", inventoryRoutes);

// Inventory Subtraction Routes
app.use("/api/inventory-subtraction", inventorySubtractionRoutes);

// Admin Production Routes
app.use("/api/admin/production", adminProductionRoutes);


// Optional test route
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// 404 handler for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
