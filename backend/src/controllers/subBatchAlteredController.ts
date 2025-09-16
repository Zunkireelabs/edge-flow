// import { Request, Response } from "express";
// import * as alteredService from "../services/subBatchAltered";

// export const createAltered = async (req: Request, res: Response) => {
//   try {
//     const result = await alteredService.createAlteredSubBatch(req.body);
//     res.status(201).json(result);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const getAllAltered = async (_req: Request, res: Response) => {
//   try {
//     const result = await alteredService.getAllAlteredSubBatches();
//     res.status(200).json(result);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// };
