// src/controllers/subBatchController.ts
import { Request, Response } from "express";
import * as subBatchService from "../services/subBatchService";
import { sendToProduction } from "../services/subBatchService";
import {
  moveSubBatchStage,
  advanceSubBatchToNextDepartment,
  markSubBatchAsCompleted,
  getSubBatchesByStatus,
  getCompletedSubBatches,
} from "../services/subBatchService";

// Create Sub-Batch
export const createSubBatch = async (req: Request, res: Response) => {
  try {
    const result = await subBatchService.createSubBatch(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res
      .status(400)
      .json({
        message: "Error creating sub-batch",
        details: err.message || err,
      });
  }
};

// Get all Sub-Batches
export const getAllSubBatches = async (_req: Request, res: Response) => {
  try {
    const subBatches = await subBatchService.getAllSubBatches();
    res.json(subBatches);
  } catch (err: any) {
    res
      .status(500)
      .json({
        message: "Error fetching sub-batches",
        details: err.message || err,
      });
  }
};

// Get Sub-Batch by ID
export const getSubBatchById = async (req: Request, res: Response) => {
  try {
    const subBatch = await subBatchService.getSubBatchById(
      Number(req.params.id)
    );
    res.json(subBatch);
  } catch (err: any) {
    res
      .status(404)
      .json({ message: "Sub-batch not found", details: err.message || err });
  }
};

// Update Sub-Batch
export const updateSubBatch = async (req: Request, res: Response) => {
  try {
    const result = await subBatchService.updateSubBatch(
      Number(req.params.id),
      req.body
    );
    res.json(result);
  } catch (err: any) {
    res
      .status(400)
      .json({
        message: "Error updating sub-batch",
        details: err.message || err,
      });
  }
};

// Delete Sub-Batch
export const deleteSubBatch = async (req: Request, res: Response) => {
  try {
    const result = await subBatchService.deleteSubBatch(Number(req.params.id));
    res.json(result);
  } catch (err: any) {
    res
      .status(400)
      .json({
        message: "Error deleting sub-batch",
        details: err.message || err,
      });
  }
};

// Send Sub-Batch to Production (template or manual)
export const sendSubBatchToProduction = async (req: Request, res: Response) => {
  try {
    const { subBatchId, workflowTemplateId, manualDepartments } = req.body;

    // Pass both to service
    const workflow = await sendToProduction(
      subBatchId,
      manualDepartments
    );

    res.status(200).json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Move stage within Kanban
export const moveStage = async (req: Request, res: Response) => {
  try {
    const { departmentSubBatchId, toStage } = req.body;
    const updated = await moveSubBatchStage(departmentSubBatchId, toStage);
    res.status(200).json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Advance to next department
export const advanceDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentSubBatchId, toDepartmentId } = req.body;

    if (!departmentSubBatchId || !toDepartmentId) {
      return res.status(400).json({
        success: false,
        message: "departmentSubBatchId and toDepartmentId are required"
      });
    }

    const nextDept = await advanceSubBatchToNextDepartment(departmentSubBatchId, toDepartmentId);
    res.status(200).json({ success: true, nextDept });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark sub-batch as completed
export const markAsCompleted = async (req: Request, res: Response) => {
  try {
    const { subBatchId } = req.body;

    if (!subBatchId) {
      return res.status(400).json({
        success: false,
        message: "subBatchId is required"
      });
    }

    const completedSubBatch = await markSubBatchAsCompleted(Number(subBatchId));
    res.status(200).json({
      success: true,
      message: "Sub-batch marked as completed",
      subBatch: completedSubBatch
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get sub-batches by status
export const getByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;

    if (!['DRAFT', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be DRAFT, IN_PRODUCTION, COMPLETED, or CANCELLED"
      });
    }

    const subBatches = await getSubBatchesByStatus(status as any);
    res.status(200).json({
      success: true,
      count: subBatches.length,
      subBatches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get completed sub-batches with optional date filtering
export const getCompleted = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const completedSubBatches = await getCompletedSubBatches(startDate, endDate);
    res.status(200).json({
      success: true,
      count: completedSubBatches.length,
      subBatches: completedSubBatches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};