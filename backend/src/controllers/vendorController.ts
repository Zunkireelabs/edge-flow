import { Request, Response } from "express";
import * as vendorService from "../services/vendorServices";

export const createVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    res.status(201).json(vendor);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error creating vendor", error: err.message });
  }
};

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await vendorService.getAllVendors();
    res.status(200).json(vendors);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error fetching vendors", error: err.message });
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.getVendorById(Number(req.params.id));
    res.status(200).json(vendor);
  } catch (err: any) {
    res.status(404).json({ message: "Vendor not found", error: err.message });
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.updateVendor(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(vendor);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error updating vendor", error: err.message });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    await vendorService.deleteVendor(Number(req.params.id));
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error deleting vendor", error: err.message });
  }
};
