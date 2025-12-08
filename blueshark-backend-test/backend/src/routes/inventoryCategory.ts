import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/inventoryCategoryController";

const router = Router();

// POST /api/inventory-categories - Create a new category
router.post("/", createCategory);

// GET /api/inventory-categories - Get all categories
router.get("/", getAllCategories);

// GET /api/inventory-categories/:id - Get a single category
router.get("/:id", getCategoryById);

// PUT /api/inventory-categories/:id - Update a category
router.put("/:id", updateCategory);

// DELETE /api/inventory-categories/:id - Delete a category
router.delete("/:id", deleteCategory);

export default router;
