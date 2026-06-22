import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getIssues, manualSyncIssues } from "../controllers/issues.controller.js";
import { getGitHubIssues } from "../controllers/githubIssues.controller.js";
const router = Router();
router.post("/sync", authMiddleware, manualSyncIssues);
// DB-backed issues
router.get("/", getIssues);
// Live GitHub issues for the logged-in user (uses stored GitHub access token)
router.get("/github", authMiddleware, getGitHubIssues);
export default router;
//# sourceMappingURL=issues.routes.js.map