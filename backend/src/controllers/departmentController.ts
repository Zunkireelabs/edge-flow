import { Request, Response } from "express";
import * as departmentService from "../services/departmentService";

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
