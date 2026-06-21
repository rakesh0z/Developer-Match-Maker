import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.ts";
import { getIssues, manualSyncIssues } from "../controllers/issues.controller.js";

const router = Router();

router.post("/sync", authMiddleware, manualSyncIssues);
router.get("/", getIssues);

export default router;

