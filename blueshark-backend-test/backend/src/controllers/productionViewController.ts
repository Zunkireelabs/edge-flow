// src/controllers/productionViewController.ts
import { Request, Response } from "express";
import {
  getProductionViewData,
  getProductionViewDataWithFilter,
} from "../services/productionViewService";

/**
 * Get production view data
 * GET /api/production-view
 *
 * Query parameters (optional):
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 * - department_id: Filter by specific department
 */
export const getProductionView = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, department_id } = req.query;

    let data;

    // Check if filters are provided
    if (start_date || end_date || department_id) {
      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;
      const deptId = department_id ? parseInt(department_id as string) : undefined;

      data = await getProductionViewDataWithFilter(startDate, endDate, deptId);
    } else {
      data = await getProductionViewData();
    }

    res.status(200).json({
      success: true,
      message: "Production view data fetched successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch production view data",
      error: error.message,
    });
  }
};
