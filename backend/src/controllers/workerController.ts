import { Request, Response } from "express";
import * as workerService from "../services/workerService";


export const createWorker = async (req: Request, res: Response) => {
  try {
    const worker = await workerService.createWorker(req.body);
    res.status(201).json(worker);
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error creating worker", error: error.message });
  }
};

export const getAllWorkers = async (_req: Request, res: Response) => {
  try {
    const workers = await workerService.getAllWorkers();
    res.json(workers);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching workers", error: error.message });
  }
};

export const getWorkerById = async (req: Request, res: Response) => {
  try {
    const worker = await workerService.getWorkerById(Number(req.params.id));
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching worker", error: error.message });
  }
};

export const updateWorker = async (req: Request, res: Response) => {
  try {
    const worker = await workerService.updateWorker(
      Number(req.params.id),
      req.body
    );
    res.json(worker);
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error updating worker", error: error.message });
  }
};

export const deleteWorker = async (req: Request, res: Response) => {
  try {
    await workerService.deleteWorker(Number(req.params.id));
    res.json({ message: "Worker deleted successfully" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error deleting worker", error: error.message });
  }
};


