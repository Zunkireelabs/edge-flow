import express from "express";
import * as vendorController from "../controllers/vendorController";

const router = express.Router();

router.post("/", vendorController.createVendor);
router.get("/", vendorController.getAllVendors);
router.get("/:id", vendorController.getVendorById);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

export default router;
