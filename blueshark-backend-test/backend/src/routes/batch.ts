// src/routes/batchRoutes.ts
import express from "express";
import * as batchController from "../controllers/batchController";

const router = express.Router();

// Legacy single-roll batch endpoints
router.post("/", batchController.createBatch);
router.get("/", batchController.getBatches);

// NEW: Multi-roll batch endpoints (must be before /:id routes)
router.get("/fabric-names", batchController.getUniqueFabricNames);       // Get unique fabric names for autocomplete
router.get("/search-rolls", batchController.searchRollsByFabricName);    // Search rolls by fabric name
router.post("/validate-rolls", batchController.validateBatchRolls);      // Validate rolls before creating batch
router.post("/with-rolls", batchController.createBatchWithRolls);        // Create batch with multiple rolls

router.post("/check-dependencies", batchController.checkDependencies);   // Must be before /:id routes

// ID-based routes (must be last)
router.get("/:id", batchController.getBatchById);
router.get("/:id/with-rolls", batchController.getBatchWithRolls);        // Get batch with batch_rolls included
router.get("/:id/size-allocation", batchController.getBatchSizeAllocation); // Get size allocation for sub-batch creation
router.put("/:id", batchController.updateBatch);
router.put("/:id/with-rolls", batchController.updateBatchWithRolls);     // Update batch with multiple rolls
router.delete("/:id", batchController.deleteBatch);

export default router;
