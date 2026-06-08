import { Router } from "express";
import {
  githubLogin,
  githubCallback,
  getCurrentUser
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
router.get("/me", authMiddleware, getCurrentUser);

export default router;