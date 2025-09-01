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
