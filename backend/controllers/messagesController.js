import mongoose from "mongoose";
import { sendSms } from "../services/twilioService.js";
import Message from "../models/Message.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";

const DPS_SCOPE = "user123";

function validId(value) {
  return mongoose.isValidObjectId(value);
}

export async function sendMessage(req, res) {
  const { contactId, body, templateId } = req.body ?? {};

  if (!validId(contactId)) {
    return res.status(400).json({ error: "Choose a valid contact." });
  }

  try {
    const contact = await Contact.findOne({
      _id: contactId,
      userId: DPS_SCOPE,
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    let finalBody = String(body ?? "").trim();

    if (templateId) {
      if (!validId(templateId)) {
        return res.status(400).json({ error: "Invalid template ID." });
      }

      const template = await Template.findOne({
        _id: templateId,
        userId: DPS_SCOPE,
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found." });
      }

      if (!finalBody) finalBody = template.body;
    }

    finalBody = finalBody
      .replace(/{{firstName}}/g, contact.firstName || "")
      .replace(/{{lastName}}/g, contact.lastName || "");

    if (!finalBody || finalBody.length > 1600) {
      return res.status(400).json({ error: "Enter a valid message." });
    }

    if (!contact.phone) {
      return res.status(400).json({ error: "Contact has no phone number." });
    }

    const twilioMessage = await sendSms(contact.phone, finalBody);

    const savedMessage = await Message.create({
      userId: DPS_SCOPE,
      contactId: contact._id,
      toPhone: contact.phone,
      fromPhone: process.env.TWILIO_PHONE_NUMBER,
      body: finalBody,
      direction: "outbound",
      status: twilioMessage.status || "sent",
      twilioSid: twilioMessage.sid,
    });

    return res.json({
      success: true,
      message: "SMS sent and logged.",
      twilioSid: twilioMessage.sid,
      dbMessage: savedMessage,
    });
  } catch (error) {
    console.error("Send SMS failed:", error);
    return res.status(500).json({ error: "Failed to send SMS." });
  }
}

export async function getMessages(_req, res) {
  try {
    const messages = await Message.find({
      userId: DPS_SCOPE,
    })
      .sort({ createdAt: -1 })
      .populate("contactId");

    return res.json(messages);
  } catch (error) {
    console.error("Get messages failed:", error);
    return res.status(500).json({ error: "Failed to fetch messages." });
  }
}

export async function getMessagesByContact(req, res) {
  if (!validId(req.params.contactId)) {
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

    const messages = await Message.find({
      userId: DPS_SCOPE,
      contactId: contact._id,
    }).sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("Get contact messages failed:", error);
    return res.status(500).json({ error: "Failed to fetch messages." });
  }
}

export async function deleteMessage(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid message ID." });
  }

  try {
    const deleted = await Message.findOneAndDelete({
      _id: req.params.id,
      userId: DPS_SCOPE,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Message not found." });
    }

    return res.json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error("Delete message failed:", error);
    return res.status(500).json({ error: "Failed to delete message." });
  }
}

export async function deleteMessagesByContact(req, res) {
  if (!validId(req.params.contactId)) {
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

    const result = await Message.deleteMany({
      userId: DPS_SCOPE,
      contactId: contact._id,
    });

    return res.json({
      success: true,
      message: "Conversation deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete conversation failed:", error);
    return res.status(500).json({ error: "Failed to delete conversation." });
  }
}

// Do not accept inbound webhooks until Twilio signature verification is added.
export function receiveMessage(_req, res) {
  return res.status(503).send("Inbound SMS is not configured.");
}
