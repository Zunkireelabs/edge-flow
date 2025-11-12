import { Request, Response } from "express";
import * as inventorySubtractionService from "../services/inventorySubtractionService";

export const createSubtraction = async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const subtractionData = {
      ...rest,
      date: date ? new Date(date) : undefined,
    };
    const subtraction = await inventorySubtractionService.createInventorySubtraction(
      subtractionData
    );
    res.status(201).json(subtraction);
  } catch (error: any) {
    res.status(400).json({
      message: "Error creating inventory subtraction",
      error: error.message,
    });
  }
};

export const getAllSubtractions = async (_req: Request, res: Response) => {
  try {
    const subtractions = await inventorySubtractionService.getAllSubtractions();
    res.json(subtractions);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching inventory subtractions",
      error: error.message,
    });
  }
};

export const getSubtractionsByInventoryId = async (req: Request, res: Response) => {
  try {
    const inventoryId = Number(req.params.inventoryId);

    if (isNaN(inventoryId)) {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }

    const subtractions = await inventorySubtractionService.getSubtractionsByInventoryId(
      inventoryId
    );
    res.json(subtractions);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching inventory subtractions",
      error: error.message,
    });
  }
};

export const getSubtractionById = async (req: Request, res: Response) => {
  try {
    const subtraction = await inventorySubtractionService.getSubtractionById(
      Number(req.params.id)
    );
    if (!subtraction) {
      return res.status(404).json({ message: "Subtraction record not found" });
    }
    res.json(subtraction);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching subtraction record",
      error: error.message,
    });
  }
};

export const deleteSubtraction = async (req: Request, res: Response) => {
  try {
    const restoreQuantity = req.query.restore === "true";
    await inventorySubtractionService.deleteSubtraction(
      Number(req.params.id),
      restoreQuantity
    );
    res.json({
      message: `Subtraction deleted successfully${restoreQuantity ? " and quantity restored" : ""}`,
    });
  } catch (error: any) {
    res.status(400).json({
      message: "Error deleting subtraction record",
      error: error.message,
    });
  }
};
