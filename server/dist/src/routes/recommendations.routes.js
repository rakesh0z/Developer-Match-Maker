import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getRecommendations } from "../controllers/recommendations.controller.js";
const router = Router();
router.get("/", authMiddleware, getRecommendations);
export default router;
//# sourceMappingURL=recommendations.routes.js.map