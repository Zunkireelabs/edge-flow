// src/controllers/batchController.ts
import { Request, Response } from "express";
import * as batchService from "../services/batchServices";

export const createBatch = async (req: Request, res: Response) => {
  try {
    const batch = await batchService.createBatch(req.body);
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ message: "Error creating batch", error: err });
  }
};

export const getBatches = async (req: Request, res: Response) => {
  try {
    const batches = await batchService.getAllBatches();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: "Error fetching batches", error: err });
  }
};

export const getBatchById = async (req: Request, res: Response) => {
  try {
    const batch = await batchService.getBatchById(Number(req.params.id));
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: "Error fetching batch", error: err });
  }
};

export const updateBatch = async (req: Request, res: Response) => {
  try {
    const batch = await batchService.updateBatch(
      Number(req.params.id),
      req.body
    );
    res.json(batch);
  } catch (err) {
    res.status(400).json({ message: "Error updating batch", error: err });
  }
};

export const deleteBatch = async (req: Request, res: Response) => {
  try {
    await batchService.deleteBatch(Number(req.params.id));
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting batch", error: err });
  }
};

export const checkDependencies = async (req: Request, res: Response) => {
  try {
    const { batchIds } = req.body;

    // Validation
    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({
        message: "Invalid request. batchIds must be a non-empty array.",
      });
    }

    // Ensure all IDs are numbers
    const validIds = batchIds.filter((id) => typeof id === "number" && id > 0);
    if (validIds.length !== batchIds.length) {
      return res.status(400).json({
        message: "All batch IDs must be valid positive numbers.",
      });
    }

    const result = await batchService.checkBatchDependencies(validIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error checking dependencies", error: err });
  }
};

// ============================================================================
// NEW: Multi-Roll Batch Controllers
// ============================================================================

/**
 * Get unique fabric names (for autocomplete)
 */
export const getUniqueFabricNames = async (req: Request, res: Response) => {
  try {
    const names = await batchService.getUniqueFabricNames();
    res.json(names);
  } catch (err) {
    res.status(500).json({ message: "Error fetching fabric names", error: err });
  }
};

/**
 * Search rolls by fabric name
 */
export const searchRollsByFabricName = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Fabric name is required" });
    }

    const rolls = await batchService.getRollsByFabricName(name);
    res.json(rolls);
  } catch (err) {
    res.status(500).json({ message: "Error searching rolls", error: err });
  }
};

/**
 * Validate rolls before creating batch
 */
export const validateBatchRolls = async (req: Request, res: Response) => {
  try {
    const { rolls, excludeBatchId } = req.body;

    if (!rolls || !Array.isArray(rolls) || rolls.length === 0) {
      return res.status(400).json({ message: "Rolls array is required" });
    }

    const validation = await batchService.validateBatchRolls(rolls, excludeBatchId);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ message: "Error validating rolls", error: err });
  }
};

/**
 * Create batch with multiple rolls and optional size breakdown
 */
export const createBatchWithRolls = async (req: Request, res: Response) => {
  try {
    const { name, order_name, unit, color, vendor_id, rolls, total_pieces, size_breakdown } = req.body;

    // Validation
    if (!name || !unit || !rolls || !Array.isArray(rolls) || rolls.length === 0) {
      return res.status(400).json({
        message: "Name, unit, and at least one roll are required",
      });
    }

    const batch = await batchService.createBatchWithRolls({
      name,
      order_name,
      unit,
      color,
      vendor_id,
      rolls,
      total_pieces,
      size_breakdown,
    });

    res.status(201).json(batch);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error creating batch", error: err });
  }
};

/**
 * Update batch with multiple rolls and optional size breakdown
 */
export const updateBatchWithRolls = async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.id);
    const { name, order_name, unit, color, vendor_id, rolls, total_pieces, size_breakdown } = req.body;

    const batch = await batchService.updateBatchWithRolls(batchId, {
      name,
      order_name,
      unit,
      color,
      vendor_id,
      rolls,
      total_pieces,
      size_breakdown,
    });

    res.json(batch);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error updating batch", error: err });
  }
};

/**
 * Get batch by ID with batch_rolls included
 */
export const getBatchWithRolls = async (req: Request, res: Response) => {
  try {
    const batch = await batchService.getBatchWithRolls(Number(req.params.id));
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: "Error fetching batch", error: err });
  }
};

/**
 * Get batch size allocation - shows available sizes for sub-batch creation
 */
export const getBatchSizeAllocation = async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.id);

    if (isNaN(batchId) || batchId <= 0) {
      return res.status(400).json({ message: "Invalid batch ID" });
    }

    const allocation = await batchService.getBatchSizeAllocation(batchId);
    res.json(allocation);
  } catch (err: any) {
    if (err.message === "Batch not found") {
      return res.status(404).json({ message: "Batch not found" });
    }
    res.status(500).json({ message: "Error fetching size allocation", error: err });
  }
};
