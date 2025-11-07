// src/routes/wage.ts
import express from "express";
import {
  getWorkerWages,
  getAllWorkersWages,
  getBillableLogs,
  getDepartmentWages,
  getSubBatchWages,
} from "../controllers/wageController";

const router = express.Router();

/**
 * Wage Calculation Routes
 *
 * These endpoints calculate wages based on worker_logs data,
 * filtering by is_billable flag to exclude rework on rejected pieces.
 */

// Get wages for a specific worker
// GET /api/wages/worker/:workerId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get("/worker/:workerId", getWorkerWages);

// Get wages for all workers
// GET /api/wages/all?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&department_id=X
router.get("/all", getAllWorkersWages);

// Get only billable work logs
// GET /api/wages/billable?worker_id=X&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get("/billable", getBillableLogs);

// Get department wage summary
// GET /api/wages/department/:departmentId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get("/department/:departmentId", getDepartmentWages);

// Get sub-batch wage summary
// GET /api/wages/sub-batch/:subBatchId
router.get("/sub-batch/:subBatchId", getSubBatchWages);

export default router;
