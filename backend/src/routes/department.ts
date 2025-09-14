import { Router } from "express";
import * as departmentController from "../controllers/departmentController";
import { getDepartmentSubBatches } from "../controllers/departmentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { deleteWorkerFromDepartment } from "../controllers/departmentController";
import { fetchProductionSubBatches } from "../controllers/departmentController";

const router = Router();

router.post("/", departmentController.createDepartment);
router.get("/", departmentController.getAllDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.put("/:id", departmentController.updateDepartment);
router.delete("/:id", departmentController.deleteDepartment);
router.get("/:id/sub-batches", authMiddleware, getDepartmentSubBatches);

// DELETE worker from department
router.delete("/departments/remove-worker", deleteWorkerFromDepartment);

// Get all sub-batches already in production
router.get("/departments/:departmentId/production-sub-batches", fetchProductionSubBatches);

export default router;
