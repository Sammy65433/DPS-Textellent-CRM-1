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

router.get("/models", async (_req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GROQ_API_KEY not set" });
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    const models = (data.data || []).map((m) => m.id);
    return res.json({ models });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;