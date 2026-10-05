import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import messageRoutes from "./routes/messages.js";
import contactRoutes from "./routes/contacts.js";
import templateRoutes from "./routes/templates.js";
import campaignRoutes from "./routes/campaigns.js";
import emailRoutes from "./routes/emails.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";
import { startCampaignScheduler } from "./services/campaignScheduler.js";
import { requireAuth, requireStaff } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

connectDB();
startCampaignScheduler();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);
app.get("/api/staff/appointments", requireAuth, requireStaff, async (_req, res) => {
  if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
    return res.status(503).json({ message: "DPS connection is not configured." });
  }

  try {
    const response = await fetch(
      
      `${process.env.DPS_API_URL}/api/appointments`,
      {
        headers: {
          "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    console.log("DPS appointments upstream status:", response.status);


    if (!response.ok) {
      return res.status(502).json({ message: "Could not load DPS appointments." });
    }

    const appointments = await response.json();
    return res.json(appointments);
  } catch (error) {
    console.error("DPS appointment request failed:", error);
    return res.status(502).json({ message: "DPS appointment service unavailable." });
  }
});

app.get("/", (req, res) => {
  res.send("Textellent backend running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
