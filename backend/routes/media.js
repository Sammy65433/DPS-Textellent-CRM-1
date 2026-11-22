import express from "express";
import {
  uploadMedia,
  getMedia,
  getMediaFile,
  deleteMedia,
} from "../controllers/mediaController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public file serving (no auth) so images work in <img> tags and emails
router.get("/:id/file", getMediaFile);

router.use(requireAuth, requireStaff);
router.post("/", uploadMedia);
router.get("/", getMedia);
router.delete("/:id", deleteMedia);

export default router;
