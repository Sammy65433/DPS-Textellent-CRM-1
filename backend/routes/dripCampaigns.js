import express from "express";
import {
  getDripCampaigns,
  createDripCampaign,
  updateDripCampaign,
  deleteDripCampaign,
  enrollContacts,
} from "../controllers/dripCampaignsController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireStaff);

router.get("/", getDripCampaigns);
router.post("/", createDripCampaign);
router.patch("/:id", updateDripCampaign);
router.delete("/:id", deleteDripCampaign);
router.post("/:id/enroll", enrollContacts);

export default router;
