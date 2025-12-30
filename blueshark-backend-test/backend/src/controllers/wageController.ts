// src/controllers/wageController.ts
import { Request, Response } from "express";
import {
  calculateWorkerWages,
  calculateAllWorkersWages,
  getBillableWorkLogs,
  getDepartmentWageSummary,
  getSubBatchWageSummary,
} from "../services/wageService";

/**
 * GET /api/wages/worker/:workerId
 * Calculate wages for a specific worker
 * Query params: start_date, end_date (optional)
 */
export const getWorkerWages = async (req: Request, res: Response) => {
  try {
    const workerId = parseInt(req.params.workerId);
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : undefined;

    if (isNaN(workerId)) {
      return res.status(400).json({ error: "Invalid worker ID" });
    }

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }

    const wageReport = await calculateWorkerWages(workerId, startDate, endDate);
    res.json(wageReport);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to calculate wages" });
  }
};

/**
 * GET /api/wages/all
 * Calculate wages for all workers
 * Query params: start_date, end_date, department_id (optional)
 */
export const getAllWorkersWages = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : undefined;
    const departmentId = req.query.department_id
      ? parseInt(req.query.department_id as string)
      : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }
    if (departmentId && isNaN(departmentId)) {
      return res.status(400).json({ error: "Invalid department_id" });
    }

    const wages = await calculateAllWorkersWages(startDate, endDate, departmentId);
    res.json(wages);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to calculate wages" });
  }
};

/**
 * GET /api/wages/billable
 * Get only billable work logs
 * Query params: worker_id, start_date, end_date (optional)
 */
export const getBillableLogs = async (req: Request, res: Response) => {
  try {
    const workerId = req.query.worker_id
      ? parseInt(req.query.worker_id as string)
      : undefined;
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : undefined;

    // Validate inputs
    if (workerId && isNaN(workerId)) {
      return res.status(400).json({ error: "Invalid worker_id" });
    }
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }

    const logs = await getBillableWorkLogs(workerId, startDate, endDate);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch billable logs" });
  }
};

/**
 * GET /api/wages/department/:departmentId
 * Get wage summary for a department
 * Query params: start_date, end_date (optional)
 */
export const getDepartmentWages = async (req: Request, res: Response) => {
  try {
    const departmentId = parseInt(req.params.departmentId);
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : undefined;

    if (isNaN(departmentId)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start_date format" });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid end_date format" });
    }

    const summary = await getDepartmentWageSummary(departmentId, startDate, endDate);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to calculate department wages" });
  }
};

/**
 * GET /api/wages/sub-batch/:subBatchId
 * Get wage summary for a sub-batch
 */
export const getSubBatchWages = async (req: Request, res: Response) => {
  try {
    const subBatchId = parseInt(req.params.subBatchId);

    if (isNaN(subBatchId)) {
      return res.status(400).json({ error: "Invalid sub-batch ID" });
    }

    const summary = await getSubBatchWageSummary(subBatchId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to calculate sub-batch wages" });
  }
};
