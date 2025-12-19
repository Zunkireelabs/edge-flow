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
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/", subBatchController.createSubBatch);
router.get("/", subBatchController.getAllSubBatches);
router.post("/check-dependencies", subBatchController.checkDependencies); // Must be before /:id routes
router.get("/:id", subBatchController.getSubBatchById);
router.put("/:id", subBatchController.updateSubBatch);
router.delete("/:id", subBatchController.deleteSubBatch);

// Send to production - requires authentication (ADMIN, SUPERVISOR, or SUPER_SUPERVISOR)
router.post(
  "/send-to-production",
  authMiddleware,
  requireRole(["ADMIN", "SUPERVISOR", "SUPER_SUPERVISOR"]),
  sendSubBatchToProduction
);

// Kanban stage moves
router.post("/move-stage", moveStage);

// Advance to next department
router.post("/advance-department", advanceDepartment);

// Completion management
router.post("/mark-completed", markAsCompleted);
router.get("/status/:status", getByStatus);
router.get("/completed/all", getCompleted);

export default router;
