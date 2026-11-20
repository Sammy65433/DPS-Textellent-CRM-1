import express from "express";
import {
  uploadMedia,
  getMedia,
  getMediaFile,
  deleteMedia,
} from "../controllers/mediaController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireStaff);
router.post("/", uploadMedia);
router.get("/", getMedia);
router.get("/:id/file", getMediaFile);
router.delete("/:id", deleteMedia);

export default router;
