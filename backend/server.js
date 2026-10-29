import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import messageRoutes from "./routes/messages.js";
import contactRoutes from "./routes/contacts.js";
import templateRoutes from "./routes/templates.js";
import campaignRoutes from "./routes/campaigns.js";
import emailRoutes from "./routes/emails.js";
import authRoutes from "./routes/authRoutes.js";
import internalContactLinkRoutes from "./routes/internalContactLinkRoutes.js";

import { connectDB } from "./config/db.js";
import { startCampaignScheduler } from "./services/campaignScheduler.js";
import { inviteStaff } from "./controllers/staffController.js";
import {
  requireAuth,
  requireStaff,
  requireAdmin,
} from "./middleware/authMiddleware.js";
import contactLinkRoutes from "./routes/contactLinkRoutes.js";
import staffDocumentRoutes from "./routes/staffDocumentRoutes.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://dps-textellent-frontend.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server requests do not send a browser Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

connectDB();
startCampaignScheduler();

app.get("/", (_req, res) => {
  res.send("Textellent backend running");
});

app.use("/api/auth", authRoutes);

app.post(
  "/api/admin/staff",
  requireAuth,
  requireAdmin,
  inviteStaff
);
app.use("/api/contact-links", contactLinkRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/staff", staffDocumentRoutes);


app.use("/api/internal/contact-links", internalContactLinkRoutes);

app.get(
  "/api/staff/appointments",
  requireAuth,
  requireStaff,
  async (_req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
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

      if (!response.ok) {
        console.error("DPS appointments upstream status:", response.status);
        return res.status(502).json({
          message: "Could not load DPS appointments.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS appointment request failed:", error);
      return res.status(502).json({
        message: "DPS appointment service unavailable.",
      });
    }
  }
);

app.patch(
  "/api/staff/appointments/:id",
  requireAuth,
  requireStaff,
  async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "Invalid appointment ID." });
    }

    const {
      service,
      tax_preparer,
      appointment_date,
      appointment_time,
      duration_minutes,
      visit_format,
      message,
    } = req.body;

    if (
      !service ||
      !tax_preparer ||
      !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date ?? "") ||
      !appointment_time ||
      ![10, 15, 30, 60].includes(Number(duration_minutes))
    ) {
      return res.status(400).json({
        message: "Complete all appointment fields.",
      });
    }

    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
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
            visit_format,
            message,
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      return res.status(response.status).json(await response.json());
    } catch (error) {
      console.error("Staff appointment update failed:", error);
      return res.status(502).json({
        message: "DPS appointment service unavailable.",
      });
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
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
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

      return res.status(response.status).json(await response.json());
    } catch (error) {
      console.error("Staff cancellation failed:", error);
      return res.status(502).json({
        message: "DPS appointment service unavailable.",
      });
    }
  }
);

app.get(
  "/api/staff/appointments/availability",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const params = new URLSearchParams({
        date: String(req.query.date || ""),
        preparer: String(req.query.preparer || ""),
        duration_minutes: String(req.query.duration_minutes || ""),
      });

      const upstream = await fetch(
        `${process.env.DPS_API_URL}/api/appointments/staff/availability?${params}`,
        {
          headers: {
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!upstream.ok) {
        console.error("DPS availability upstream status:", upstream.status);
        return res.status(502).json({
          message: "Could not load DPS availability.",
        });
      }

      const data = await upstream.json();
      return res.json(data);
    } catch (error) {
      console.error("Staff availability proxy failed:", error);
      return res.status(502).json({
        message: "Availability service unavailable.",
      });
    }
  }
);

app.post(
  "/api/staff/appointments",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const upstream = await fetch(
        `${process.env.DPS_API_URL}/api/appointments/staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      return res.status(upstream.status).json(await upstream.json());
    } catch (error) {
      console.error("Staff booking proxy failed:", error);
      return res.status(502).json({
        message: "Booking service unavailable.",
      });
    }
  }
);

app.get(
  "/api/staff/realty-appointments",
  requireAuth,
  requireStaff,
  async (_req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments`,
        {
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointments upstream status:", response.status);
        return res.status(502).json({
          message: "Could not load DPS realty appointments.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointments request failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

app.patch(
  "/api/staff/realty-appointments/:id",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments/${req.params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointment update status:", response.status);
        return res.status(502).json({
          message: "Could not update DPS realty appointment.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointment update failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

app.patch(
  "/api/staff/realty-appointments/:id/confirm",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments/${req.params.id}/confirm`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointment confirm status:", response.status);
        return res.status(502).json({
          message: "Could not confirm DPS realty appointment.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointment confirm failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

app.patch(
  "/api/staff/realty-appointments/:id/cancel",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments/${req.params.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointment cancel status:", response.status);
        return res.status(502).json({
          message: "Could not cancel DPS realty appointment.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointment cancel failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

app.patch(
  "/api/staff/realty-appointments/:id/archive",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments/${req.params.id}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointment archive status:", response.status);
        return res.status(502).json({
          message: "Could not archive DPS realty appointment.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointment archive failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

app.delete(
  "/api/staff/realty-appointments/:id",
  requireAuth,
  requireStaff,
  async (req, res) => {
    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
      return res.status(503).json({
        message: "DPS connection is not configured.",
      });
    }

    try {
      const response = await fetch(
        `${process.env.DPS_API_URL}/api/realty-appointments/${req.params.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        console.error("DPS realty appointment delete status:", response.status);
        return res.status(502).json({
          message: "Could not delete DPS realty appointment.",
        });
      }

      return res.json(await response.json());
    } catch (error) {
      console.error("DPS realty appointment delete failed:", error);
      return res.status(502).json({
        message: "DPS realty appointment service unavailable.",
      });
    }
  }
);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
