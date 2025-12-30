import { Router } from "express";
import prisma from "../config/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const start = Date.now();

    // Simple query: just count users (lightweight, no heavy join)
    await prisma.user.count();

    const duration = Date.now() - start;

    res.json({
      status: "ok",
      dbQueryTimeMs: duration,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err });
  }
});

export default router;
