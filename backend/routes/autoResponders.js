import express from "express";
import { getAutoResponders, updateAutoResponder } from "../controllers/autoRespondersController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireStaff);

router.get("/", getAutoResponders);
router.patch("/:type", updateAutoResponder);

export default router;
