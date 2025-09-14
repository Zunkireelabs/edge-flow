import { Request, Response } from "express";
import * as supervisorService from "../services/supervisorService";
import { updateSupervisor } from "../services/supervisorService";
import {deleteSupervisorService } from "../services/supervisorService";
import { AuthRequest } from "../types/express"; // custom type where user info is attached
import * as departmentService from "../services/departmentService";

export const createSupervisor = async (req: Request, res: Response) => {
  try {
    const { name, email, password, departmentId } = req.body;

    // Only check mandatory fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const supervisor = await supervisorService.createSupervisor({
      name,
      email,
      password,
      departmentId, // optional
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
    const supervisorId = req.user?.userId; // get supervisorId from auth middleware

    if (!supervisorId) {
      return res.status(400).json({ message: "Supervisor ID is required" });
    }

    const subBatches = await departmentService.getSubBatchesByDepartment(
      supervisorId
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