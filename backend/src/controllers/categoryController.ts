import { Request, Response } from "express";
import * as categoryService from "../services/categoryService";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.json(categories);
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(
      Number(req.params.id)
    );
    res.json(category);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.updateCategory(
      Number(req.params.id),
      req.body
    );
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
