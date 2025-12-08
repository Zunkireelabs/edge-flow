import { Request, Response } from "express";
import * as inventoryCategoryService from "../services/inventoryCategoryService";

// Create a new inventory category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if name already exists
    const nameExists = await inventoryCategoryService.categoryNameExists(name.trim());
    if (nameExists) {
      return res.status(400).json({ message: "A category with this name already exists" });
    }

    const category = await inventoryCategoryService.createInventoryCategory({
      name: name.trim(),
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating inventory category:", error);
    res.status(500).json({ message: error.message || "Failed to create category" });
  }
};

// Get all inventory categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await inventoryCategoryService.getAllInventoryCategories();
    res.json(categories);
  } catch (error: any) {
    console.error("Error fetching inventory categories:", error);
    res.status(500).json({ message: error.message || "Failed to fetch categories" });
  }
};

// Get a single inventory category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await inventoryCategoryService.getInventoryCategoryById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error: any) {
    console.error("Error fetching inventory category:", error);
    res.status(500).json({ message: error.message || "Failed to fetch category" });
  }
};

// Update an inventory category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if category exists
    const existingCategory = await inventoryCategoryService.getInventoryCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if new name already exists (excluding current category)
    const nameExists = await inventoryCategoryService.categoryNameExists(name.trim(), id);
    if (nameExists) {
      return res.status(400).json({ message: "A category with this name already exists" });
    }

    const category = await inventoryCategoryService.updateInventoryCategory(id, {
      name: name.trim(),
    });

    res.json(category);
  } catch (error: any) {
    console.error("Error updating inventory category:", error);
    res.status(500).json({ message: error.message || "Failed to update category" });
  }
};

// Delete an inventory category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Check if category exists
    const existingCategory = await inventoryCategoryService.getInventoryCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    await inventoryCategoryService.deleteInventoryCategory(id);

    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting inventory category:", error);

    // Check if it's the "items using category" error
    if (error.message && error.message.includes("Cannot delete category")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || "Failed to delete category" });
  }
};
