// src/controllers/departmentSubBatchController.ts
import { Request, Response } from "express";
import * as departmentSubBatchService from "../services/departmentSubBatchService";

// Get all department_sub_batches entries (all sub-batches)
export const getAllDepartmentSubBatches = async (
  req: Request,
  res: Response
) => {
  try {
    const entries = await departmentSubBatchService.getAllDepartmentSubBatches();

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Error fetching all department sub-batches",
    });
  }
};

// Get all department_sub_batches entries for a specific sub-batch
export const getAllEntriesForSubBatch = async (
  req: Request,
  res: Response
) => {
  try {
    const subBatchId = Number(req.params.subBatchId);

    if (isNaN(subBatchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sub-batch ID",
      });
    }

    const entries = await departmentSubBatchService.getAllEntriesForSubBatch(subBatchId);

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Error fetching department entries",
    });
  }
};

// Get all department_sub_batch_history entries
export const getAllDepartmentSubBatchHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const history = await departmentSubBatchService.getAllDepartmentSubBatchHistory();

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Error fetching department sub-batch history",
    });
  }
};

// Get sub-batch history (completed departments with worker logs)
export const getSubBatchHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const subBatchId = Number(req.params.subBatchId);

    if (isNaN(subBatchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sub-batch ID",
      });
    }

    const history = await departmentSubBatchService.getSubBatchHistory(subBatchId);

    res.status(200).json({
      success: true,
      sub_batch_id: subBatchId,
      completed_departments_count: history.department_details.length,
      department_flow: history.department_flow,
      department_details: history.department_details,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Error fetching sub-batch history",
    });
  }
};
