import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getIssues, manualSyncIssues } from "../controllers/issues.controller.js";
const router = Router();
router.post("/sync", authMiddleware, manualSyncIssues);
router.get("/", getIssues);
export default router;
//# sourceMappingURL=issues.routes.js.map