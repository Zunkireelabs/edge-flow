import { Router } from "express";
import { getWorkflowStatus } from "../controllers/subBatchWorkflowController";

const router = Router();

// GET workflow status for a sub-batch
router.get("/:subBatchId/status", getWorkflowStatus);

export default router;
