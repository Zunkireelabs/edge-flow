import { Request, Response } from "express";
import { getSubBatchWorkflowStatus } from "../services/subBatchWorkflow";

export const getWorkflowStatus = async (req: Request, res: Response) => {
  try {
    const { subBatchId } = req.params;

    if (!subBatchId) {
      return res
        .status(400)
        .json({ success: false, message: "subBatchId is required" });
    }

    const workflow = await getSubBatchWorkflowStatus(Number(subBatchId));

    if (!workflow) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Workflow not found for this sub-batch",
        });
    }

    return res.json({ success: true, data: workflow });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
