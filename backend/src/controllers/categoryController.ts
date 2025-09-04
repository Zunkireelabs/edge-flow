// src/controllers/categoryController.ts
import { Request, Response } from "express";
import * as categoryService from "../services/categoryService";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(400).json({ message: "Error creating category", error: err });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", error: err });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(
      Number(req.params.id)
    );
    res.json(category);
  } catch (err) {
    res.status(404).json({ message: "Category not found", error: err });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.updateCategory(
      Number(req.params.id),
      req.body
    );
    res.json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(400).json({ message: "Error updating category", error: err });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting category", error: err });
  }
};
