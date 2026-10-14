import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { Resend } from "resend";

import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";
import Contact from "../models/Contact.js";
import ContactLink from "../models/ContactLink.js";

const router = Router();
const CONTACT_SCOPE = "user123";
const LINK_LIFETIME_MS = 24 * 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 10 * 60 * 1000;

router.use(requireAuth, requireStaff);

router.post("/:contactId/request", async (req, res) => {
  const { contactId } = req.params;

  if (!mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ message: "Invalid contact ID." });
  }

  if (!process.env.RESEND_API_KEY || !process.env.DPS_FRONTEND_URL) {
    return res.status(503).json({
      message: "Invitation email is not configured.",
    });
  }

  try {
    const contact = await Contact.findOne({
      _id: contactId,
      userId: CONTACT_SCOPE,
    }).select("+supabaseCustomerId");

    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    if (contact.supabaseCustomerId) {
      return res.status(409).json({ message: "Contact already linked." });
    }

    const recipientEmail = String(contact.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({
        message: "Contact needs a valid email address.",
      });
    }

    const recentRequest = await ContactLink.findOne({
      contactId: contact._id,
      createdAt: { $gt: new Date(Date.now() - REQUEST_COOLDOWN_MS) },
    });

    if (recentRequest) {
      return res.status(429).json({
        message: "An invitation was recently requested. Try again later.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await ContactLink.create({
      contactId: contact._id,
      recipientEmail,
      tokenHash,
      expiresAt: new Date(Date.now() + LINK_LIFETIME_MS),
      requestedBy: req.user._id,
    });

    const baseUrl = process.env.DPS_FRONTEND_URL.replace(/\/$/, "");
    const link = `${baseUrl}/client-link?token=${encodeURIComponent(token)}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    const safeName = String(contact.firstName || "DPS client")
      .replace(/[&<>"']/g, "");

    const result = await resend.emails.send({
      from: "DPS CRM <appointments@dpstaxpro.com>",
      to: recipientEmail,
      subject: "Connect your DPS client account",
      html: `
        <p>Hello ${safeName},</p>
        <p>A DPS team member invited you to connect your client account.
        Sign in using the link below, then confirm the connection.</p>
        <p><a href="${link}">Connect my account</a></p>
        <p>This invitation expires in 15 minutes. If you did not expect it,
        contact DPS at (973) 327-2340.</p>
      `,
    });

    if (result.error) {
      await ContactLink.deleteOne({ _id: invitation._id });
      console.error("Contact link email failed:", result.error);
      return res.status(502).json({ message: "Could not send invitation." });
    }

    return res.status(202).json({
      message: "Account-link invitation sent.",
    });
  } catch (error) {
    console.error("Contact link request failed:", error);
    return res.status(500).json({
      message: "Could not request account link.",
    });
  }
});

export default router;
