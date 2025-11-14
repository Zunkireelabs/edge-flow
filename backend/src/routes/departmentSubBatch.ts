// src/routes/departmentSubBatch.ts
import { Router } from "express";
import * as departmentSubBatchController from "../controllers/departmentSubBatchController";

const router = Router();

// Get all department_sub_batches entries (all sub-batches)
router.get("/all", departmentSubBatchController.getAllDepartmentSubBatches);

// Get all department_sub_batch_history entries
router.get("/history", departmentSubBatchController.getAllDepartmentSubBatchHistory);

// Get sub-batch history (completed departments with worker logs)
router.get("/sub-batch-history/:subBatchId", departmentSubBatchController.getSubBatchHistory);

// Get all department_sub_batches entries for a specific sub-batch
router.get("/sub-batch/:subBatchId", departmentSubBatchController.getAllEntriesForSubBatch);

// ✅ Assign worker to a department_sub_batch entry
router.put("/assign-worker", departmentSubBatchController.assignWorkerToDepartmentSubBatch);

export default router;
