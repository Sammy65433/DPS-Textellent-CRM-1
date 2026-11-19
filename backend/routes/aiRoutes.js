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
router.get("/models", async (_req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY not set" });
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "X-goog-api-key": apiKey },
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    const models = (data.models || []).map((m) => m.name).filter((n) => n.includes("flash") || n.includes("pro"));
    return res.json({ models, raw: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;