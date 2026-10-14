import mongoose from "mongoose";
import { Resend } from "resend";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";
import EmailMessage from "../models/EmailMessage.js";

const DPS_SCOPE = "user123";

const cleanEmail = (value) =>
  String(value ?? "").trim().toLowerCase();

const validEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function renderTemplate(body, contact) {
  return body
    .replace(/{{firstName}}/g, contact?.firstName || "")
    .replace(/{{lastName}}/g, contact?.lastName || "");
}

export async function sendEmailMessage(req, res) {
  const { contactId, toEmail, subject, body, templateId } = req.body ?? {};

  try {
    let contact = null;

    if (contactId) {
      if (!mongoose.isValidObjectId(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID." });
      }

      contact = await Contact.findOne({
        _id: contactId,
        userId: DPS_SCOPE,
      });

      if (!contact) {
        return res.status(404).json({ error: "Contact not found." });
      }
    }

    let template = null;

    if (templateId) {
      if (!mongoose.isValidObjectId(templateId)) {
        return res.status(400).json({ error: "Invalid template ID." });
      }

      template = await Template.findOne({
        _id: templateId,
        userId: DPS_SCOPE,
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found." });
      }
    }

    const recipient = cleanEmail(toEmail || contact?.email);
    const emailSubject = String(subject ?? "").trim();
    const emailBody = renderTemplate(
      String(body || template?.body || "").trim(),
      contact
    );

    if (!validEmail(recipient) || recipient.length > 254) {
      return res.status(400).json({ error: "Valid recipient email required." });
    }

    if (!emailSubject || emailSubject.length > 200) {
      return res.status(400).json({ error: "Valid subject required." });
    }

    if (!emailBody || emailBody.length > 20000) {
      return res.status(400).json({ error: "Valid email body required." });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ error: "Email service unavailable." });
    }

    // Send as plain text. Do not insert staff-entered content into HTML.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "DPS CRM <appointments@dpstaxpro.com>",
      to: recipient,
      subject: emailSubject,
      text: emailBody,
    });

    if (result.error) {
      console.error("Resend individual email failed:", result.error);
      return res.status(502).json({ error: "Failed to send email." });
    }

    const savedEmail = await EmailMessage.create({
      userId: DPS_SCOPE,
      contactId: contact?._id || null,
      toEmail: recipient,
      subject: emailSubject,
      body: emailBody,
      status: "sent",
      resendId: result.data?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully.",
      resendId: result.data?.id || null,
      dbEmail: savedEmail,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({ error: "Failed to send email." });
  }
}

export async function getEmailMessages(_req, res) {
  try {
    const emails = await EmailMessage.find({
      userId: DPS_SCOPE,
    })
      .sort({ createdAt: -1 })
      .populate("contactId");

    return res.status(200).json(emails);
  } catch (error) {
    console.error("Get emails error:", error);
    return res.status(500).json({ error: "Failed to fetch emails." });
  }
}

export async function getEmailsByContact(req, res) {
  if (!mongoose.isValidObjectId(req.params.contactId)) {
    return res.status(400).json({ error: "Invalid contact ID." });
  }

  try {
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      userId: DPS_SCOPE,
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    const emails = await EmailMessage.find({
      userId: DPS_SCOPE,
      contactId: contact._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json(emails);
  } catch (error) {
    console.error("Get contact emails error:", error);
    return res.status(500).json({ error: "Failed to fetch contact emails." });
  }
}

export async function deleteEmailMessage(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid email ID." });
  }

  try {
    const deleted = await EmailMessage.findOneAndDelete({
      _id: req.params.id,
      userId: DPS_SCOPE,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Email not found." });
    }

    return res.json({
      success: true,
      message: "Email deleted successfully.",
    });
  } catch (error) {
    console.error("Delete email error:", error);
    return res.status(500).json({ error: "Failed to delete email." });
  }
}

export async function deleteEmailsByContact(req, res) {
  if (!mongoose.isValidObjectId(req.params.contactId)) {
    return res.status(400).json({ error: "Invalid contact ID." });
  }

  try {
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      userId: DPS_SCOPE,
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    const result = await EmailMessage.deleteMany({
      userId: DPS_SCOPE,
      contactId: contact._id,
    });

    return res.json({
      success: true,
      message: "Email conversation deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete contact emails error:", error);
    return res.status(500).json({
      error: "Failed to delete email conversation.",
    });
  }
}
