import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getSkills, syncSkills } from "../controllers/skills.controller.js";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../controllers/users.controller.js";
const router = Router();
router.post("/sync-skills", authMiddleware, syncSkills);
router.get("/skills", authMiddleware, getSkills);
router.get("/profile", authMiddleware, getCurrentUserProfile);
router.put("/profile", authMiddleware, updateCurrentUserProfile);
export default router;
//# sourceMappingURL=users.routes.js.map