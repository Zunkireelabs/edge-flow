import { Request, Response } from "express";
import * as inventoryService from "../services/inventoryService";

export const createInventory = async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const inventoryData = {
      ...rest,
      date: date ? new Date(date) : undefined,
    };
    const inventory = await inventoryService.createInventory(inventoryData);
    res.status(201).json(inventory);
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error creating inventory item", error: error.message });
  }
};

export const getAllInventory = async (_req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getAllInventory();
    res.json(inventory);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching inventory", error: error.message });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getInventoryById(
      Number(req.params.id)
    );
    if (!inventory)
      return res.status(404).json({ message: "Inventory item not found" });
    res.json(inventory);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching inventory item", error: error.message });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const updateData = {
      ...rest,
      date: date ? new Date(date) : undefined,
    };
    const inventory = await inventoryService.updateInventory(
      Number(req.params.id),
      updateData
    );
    res.json(inventory);
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error updating inventory item", error: error.message });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    await inventoryService.deleteInventory(Number(req.params.id));
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: "Error deleting inventory item", error: error.message });
  }
};

// Addition Controllers
export const createAddition = async (req: Request, res: Response) => {
  try {
    const { date, ...rest } = req.body;
    const additionData = {
      ...rest,
      date: date ? new Date(date) : undefined,
    };
    const addition = await inventoryService.createInventoryAddition(additionData);
    res.status(201).json(addition);
  } catch (error: any) {
    res.status(400).json({
      message: "Error creating inventory addition",
      error: error.message,
    });
  }
};

export const getAllAdditions = async (_req: Request, res: Response) => {
  try {
    const additions = await inventoryService.getAllAdditions();
    res.json(additions);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching inventory additions",
      error: error.message,
    });
  }
};

export const getAdditionsByInventoryId = async (req: Request, res: Response) => {
  try {
    const inventoryId = Number(req.params.inventoryId);

    if (isNaN(inventoryId)) {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }

    const additions = await inventoryService.getAdditionsByInventoryId(inventoryId);
    res.json(additions);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching inventory additions",
      error: error.message,
    });
  }
};

export const getAdditionById = async (req: Request, res: Response) => {
  try {
    const addition = await inventoryService.getAdditionById(
      Number(req.params.id)
    );
    if (!addition) {
      return res.status(404).json({ message: "Addition record not found" });
    }
    res.json(addition);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching addition record",
      error: error.message,
    });
  }
};

export const deleteAddition = async (req: Request, res: Response) => {
  try {
    const removeQuantity = req.query.remove === "true";
    await inventoryService.deleteAddition(
      Number(req.params.id),
      removeQuantity
    );
    res.json({
      message: `Addition deleted successfully${removeQuantity ? " and quantity removed" : ""}`,
    });
  } catch (error: any) {
    res.status(400).json({
      message: "Error deleting addition record",
      error: error.message,
    });
  }
};
