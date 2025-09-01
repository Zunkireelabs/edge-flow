import express from "express";
import * as rollController from "../controllers/rollController";

const router = express.Router();

router.post("/", rollController.createRoll);
router.get("/", rollController.getAllRolls);
router.get("/:id", rollController.getRollById);
router.put("/:id", rollController.updateRoll);
router.delete("/:id", rollController.deleteRoll);

export default router;
