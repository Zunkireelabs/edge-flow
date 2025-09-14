import { Router } from "express";
import { createSupervisor, getSupervisors, assignDepartment } from "../controllers/supervisorController";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";
import { updateSupervisorController } from "../controllers/supervisorController";
import { deleteSupervisor} from "../controllers/supervisorController";

const router = Router();

// Only ADMIN can create supervisors
router.post("/", authMiddleware, requireRole("ADMIN"), createSupervisor);

// Only ADMIN can assign/reassign departments
router.patch("/assign-department", authMiddleware, requireRole("ADMIN"), assignDepartment);

router.get("/", getSupervisors); // ✅ new GET endpoint



// Only ADMIN can delete supervisor
router.delete("/:id",  deleteSupervisor);

// Only ADMIN can update supervisor
router.put("/:id", updateSupervisorController);


export default router;
