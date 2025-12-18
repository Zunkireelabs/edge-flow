import { Request, Response } from "express";
import * as supervisorService from "../services/supervisorService";
import { updateSupervisor } from "../services/supervisorService";
import {deleteSupervisorService } from "../services/supervisorService";
import { AuthRequest } from "../types/express"; // custom type where user info is attached
import * as departmentService from "../services/departmentService";

export const createSupervisor = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    // Only check mandatory fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Validate role if provided
    if (role && !["SUPERVISOR", "SUPER_SUPERVISOR"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role. Must be SUPERVISOR or SUPER_SUPERVISOR" });
    }

    const supervisor = await supervisorService.createSupervisor({
      name,
      email,
      password,
      role: role || "SUPERVISOR",
      departmentId: role === "SUPER_SUPERVISOR" ? undefined : departmentId,
    });

    res.status(201).json({ success: true, data: supervisor });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all supervisors
export const getSupervisors = async (req: Request, res: Response) => {
  try {
    const supervisors = await supervisorService.getAllSupervisors();
    res.status(200).json({ success: true, data: supervisors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignDepartment = async (req: Request, res: Response) => {
  try {
    const { supervisorId, departmentId } = req.body;
    const updatedSupervisor = await supervisorService.assignSupervisorToDepartment(
      supervisorId,
      departmentId
    );
    res.status(200).json({ success: true, supervisor: updatedSupervisor });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateSupervisorController = async (
  req: Request,
  res: Response
) => {
  try {
    const supervisorId = parseInt(req.params.id);
    const { name, email, newPassword } = req.body;

    if (!name && !email && !newPassword) {
      return res
        .status(400)
        .json({ message: "Provide at least one field to update" });
    }

    const updated = await updateSupervisor(supervisorId, {
      name,
      email,
      newPassword,
    });

    return res.json({
      message: "Supervisor updated successfully",
      supervisor: updated,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete supervisor
export const deleteSupervisor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteSupervisorService(parseInt(id));
    res.json({ message: "Supervisor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting supervisor" });
  }
};




export const getSupervisorSubBatches = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const role = req.user?.role;
    const departmentId = req.user?.departmentId;

    // SUPER_SUPERVISOR can optionally pass departmentId as query param
    const queryDeptId = req.query.departmentId as string | undefined;

    let targetDepartmentId: number | undefined;

    if (role === "SUPER_SUPERVISOR") {
      // SUPER_SUPERVISOR can view any department
      if (queryDeptId && queryDeptId !== "all") {
        targetDepartmentId = parseInt(queryDeptId, 10);
        if (isNaN(targetDepartmentId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid department ID format"
          });
        }
      } else {
        // Return message to select a department for Kanban view
        return res.status(200).json({
          success: true,
          message: "Please select a specific department to view tasks",
          data: { newArrival: [], inProgress: [], completed: [] },
          requiresDepartmentSelection: true,
        });
      }
    } else {
      // Regular SUPERVISOR uses their assigned department
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Supervisor is not assigned to any department"
        });
      }
      targetDepartmentId = departmentId;
    }

    const subBatches = await departmentService.getSubBatchesByDepartment(
      targetDepartmentId
    );

    return res.status(200).json({
      success: true,
      message: "Sub-batches fetched successfully",
      data: subBatches,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};