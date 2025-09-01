import { Request, Response } from "express";
import * as rollService from "../services/rollServices";

export const createRoll = async (req: Request, res: Response) => {
  try {
    const data = await rollService.createRoll(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllRolls = async (req: Request, res: Response) => {
  try {
    const rolls = await rollService.getAllRolls();
    res.status(200).json(rolls);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRollById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const roll = await rollService.getRollById(id);
    res.status(200).json(roll);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateRoll = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updatedRoll = await rollService.updateRoll(id, req.body);
    res.status(200).json(updatedRoll);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoll = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await rollService.deleteRoll(id);
    res.status(200).json({ message: "Roll deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
