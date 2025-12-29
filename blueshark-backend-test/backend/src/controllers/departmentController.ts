import { Request, Response } from "express";
import * as departmentService from "../services/departmentService";
import { AuthRequest } from "../middleware/authMiddleware";
import { removeWorkerFromDepartment } from "../services/departmentService";
import { getProductionSubBatches } from "../services/departmentService";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    res
      .status(201)
      .json({ message: "Department created successfully", department });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const department = await departmentService.getDepartmentById(
      Number(req.params.id)
    );
    res.json(department);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const department = await departmentService.updateDepartment(
      Number(req.params.id),
      req.body
    );
    res.json({ message: "Department updated successfully", department });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await departmentService.deleteDepartment(
      Number(req.params.id)
    );
    res.json({ message: "Department deleted successfully", department });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};


export const getDepartmentSubBatches = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    let departmentId = Number(req.params.id);

    // If supervisor, override departmentId with their assigned department
    if (req.user?.role === "SUPERVISOR") {
      departmentId = req.user.departmentId!;
    }

    const result = await departmentService.getSubBatchesByDepartment(
      departmentId
    );
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Remove worker from department
export const deleteWorkerFromDepartment = async (
  req: Request,
  res: Response
) => {
  try {
    const { departmentId, workerId } = req.body;

    if (!departmentId || !workerId) {
      return res
        .status(400)
        .json({ message: "departmentId and workerId are required" });
    }

    const result = await removeWorkerFromDepartment(
      Number(departmentId),
      Number(workerId)
    );

    if (result.count === 0) {
      return res
        .status(404)
        .json({ message: "Worker not found in this department" });
    }

    return res.json({ message: "Worker removed from department successfully" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all the sub-batches that are sent to production

export const fetchProductionSubBatches = async (
  req: Request,
  res: Response
) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const subBatches = await getProductionSubBatches(Number(departmentId));

    return res.json({
      message: "Production sub-batches fetched successfully",
      data: subBatches.map((dsb) => dsb.sub_batch), // send only sub_batches if frontend doesn’t need junction info
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};