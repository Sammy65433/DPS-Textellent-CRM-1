import crypto from "node:crypto";
import User from "../models/User.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteStaff(req, res) {
  const firstName = String(req.body?.firstName || "").trim();
  const lastName = String(req.body?.lastName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid name and email." });
  }

  if (!process.env.CRM_FRONTEND_URL) {
    return res.status(503).json({ message: "CRM frontend URL is missing." });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Account already exists." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      role: "staff",
      active: false,
      password: crypto.randomBytes(32).toString("hex"),
      setupTokenHash: hash,
      setupTokenExpiresAt: expiresAt,
    });

    const link =
      `${process.env.CRM_FRONTEND_URL}/setup-password?token=${encodeURIComponent(token)}`;

    const result = await resend.emails.send({
      from: "DPS CRM <appointments@dpstaxpro.com>",
      to: email,
      subject: "Set up your DPS CRM account",
      html: `<p>Hello ${firstName},</p><p>Your DPS CRM account is ready. This link expires in 24 hours:</p><p><a href="${link}">Set your password</a></p>`,
    });

    if (result.error) {
      await User.deleteOne({ _id: user._id });
      throw result.error;
    }

    return res.status(201).json({ message: "Staff invitation sent." });
  } catch (error) {
    console.error("Staff invitation failed:", error);
    return res.status(500).json({ message: "Could not invite staff." });
  }
}
