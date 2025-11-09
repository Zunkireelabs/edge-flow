// src/routes/subBatchRoutes.ts
import { Router } from "express";
import * as subBatchController from "../controllers/subBatchController";
import {
  moveStage,
  advanceDepartment,
  sendSubBatchToProduction,
  markAsCompleted,
  getByStatus,
  getCompleted,
} from "../controllers/subBatchController";

const router = Router();

router.post("/", subBatchController.createSubBatch);
router.get("/", subBatchController.getAllSubBatches);
router.get("/:id", subBatchController.getSubBatchById);
router.put("/:id", subBatchController.updateSubBatch);
router.delete("/:id", subBatchController.deleteSubBatch);
router.post("/send-to-production", sendSubBatchToProduction);

// Kanban stage moves
router.post("/move-stage", moveStage);

// Advance to next department
router.post("/advance-department", advanceDepartment);

// Completion management
router.post("/mark-completed", markAsCompleted);
router.get("/status/:status", getByStatus);
router.get("/completed/all", getCompleted);

export default router;
