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
import { inviteStaff } from "./controllers/staffController.js";
import {
  requireAuth,
  requireStaff,
  requireAdmin,
} from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

connectDB();
startCampaignScheduler();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.post("/api/admin/staff", requireAuth, requireAdmin, inviteStaff);
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
        signal: AbortSignal.timeout(60000),
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
app.patch(
  "/api/staff/appointments/:id",
  requireAuth,
  requireStaff,
  async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "Invalid appointment ID." });
    }

    const { service, tax_preparer, appointment_date, appointment_time, duration_minutes } =
      req.body;

    if (
      !service ||
      !tax_preparer ||
      !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date ?? "") ||
      !appointment_time ||
      ![15, 30, 60].includes(Number(duration_minutes))
    ) {
      return res.status(400).json({ message: "Complete all appointment fields." });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/appointments/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify({
            service,
            tax_preparer,
            appointment_date,
            appointment_time,
            duration_minutes: Number(duration_minutes),
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Staff appointment update failed:", error);
      return res.status(502).json({ message: "DPS appointment service unavailable." });
    }
  }
);
app.patch(
  "/api/staff/appointments/:id/cancel",
  requireAuth,
  requireStaff,
  async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "Invalid appointment ID." });
    }

    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({ message: "DPS connection is not configured." });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/appointments/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          signal: AbortSignal.timeout(60000),
        }
      );

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Staff cancellation failed:", error);
      return res.status(502).json({
        message: "DPS appointment service unavailable.",
      });
    }
  }
);



app.get("/", (req, res) => {
  res.send("Textellent backend running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
