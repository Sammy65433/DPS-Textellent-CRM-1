import express from "express";
import {
  createTemplate,
  getTemplates,
  deleteTemplate,
} from "../controllers/templatesController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireStaff);
router.post("/", createTemplate);
router.get("/", getTemplates);
router.delete("/:id", deleteTemplate);

export default router;
