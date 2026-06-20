import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getSkills, syncSkills } from "../controllers/skills.controller.js";
const router = Router();
router.post("/sync-skills", authMiddleware, syncSkills);
router.get("/skills", authMiddleware, getSkills);
export default router;
//# sourceMappingURL=users.routes.js.map