import express from "express";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";
import {
  chatWithAssistant,
  generateContactSummary,
  generateCampaignCopy,
  naturalLanguageSearch,
  smartFollowUps,
  aiScheduleAppointment,
  extractDocumentData,
} from "../controllers/aiController.js";

const router = express.Router();

router.use(requireAuth, requireStaff);

router.post("/chat", chatWithAssistant);
router.post("/contact-summary", generateContactSummary);
router.post("/campaign-copy", generateCampaignCopy);
router.post("/search", naturalLanguageSearch);
router.post("/follow-ups", smartFollowUps);
router.post("/schedule", aiScheduleAppointment);
router.post("/extract-document", extractDocumentData);

export default router;