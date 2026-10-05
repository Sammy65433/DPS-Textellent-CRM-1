import express from "express";
import { loginUser, setupPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/setup-password", setupPassword);

export default router;
