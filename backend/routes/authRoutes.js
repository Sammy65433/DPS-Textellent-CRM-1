import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { loginUser, setupPassword, getMe, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/me", requireAuth, getMe);
router.post("/setup-password", setupPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
