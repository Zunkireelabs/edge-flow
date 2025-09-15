// src/routes/workerLogRoutes.ts
import { Router } from "express";
import {
  createWorkerLogController,
  getAllWorkerLogsController,
  getWorkerLogByIdController,
  updateWorkerLogController,
  deleteWorkerLogController,
} from "../controllers/workerLogController";

const router = Router();

// CRUD routes
router.post("/logs", createWorkerLogController);
router.get("/logs", getAllWorkerLogsController);
router.get("/logs/:id", getWorkerLogByIdController);
router.put("/logs/:id", updateWorkerLogController);
router.delete("/logs/:id", deleteWorkerLogController);

export default router;
