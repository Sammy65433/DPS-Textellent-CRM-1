import { sendSms } from "../services/twilioService.js";
import Message from "../models/Message.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";

export const sendMessage = async (req, res) => {
  try {
    const { userId, contactId, to, body, templateId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    let toPhone = to;
    let finalBody = body;
    let contact = null;

    if (contactId) {
      contact = await Contact.findById(contactId);

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (!toPhone) {
        toPhone = contact.phone;
      }
    }

    if (templateId) {
      const template = await Template.findById(templateId);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (!finalBody) {
        finalBody = template.body;
      }

      if (contact) {
        finalBody = finalBody
          .replace(/{{firstName}}/g, contact.firstName || "")
          .replace(/{{lastName}}/g, contact.lastName || "");
      }
    }

    if (!toPhone) {
      return res.status(400).json({
        error: "Recipient phone or contactId is required",
      });
    }

    if (!finalBody) {
      return res.status(400).json({
        error: "Message body or templateId is required",
      });
    }

    const twilioMessage = await sendSms(toPhone, finalBody);

    const savedMessage = await Message.create({
      userId,
      contactId: contactId || null,
      toPhone,
      fromPhone: process.env.TWILIO_PHONE_NUMBER,
      body: finalBody,
      direction: "outbound",
      status: twilioMessage.status || "sent",
      twilioSid: twilioMessage.sid,
    });

    res.status(200).json({
      success: true,
      message: "SMS sent and logged successfully",
      twilioSid: twilioMessage.sid,
      dbMessage: savedMessage,
    });
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    res.status(500).json({ error: "Failed to send SMS" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const messages = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .populate("contactId");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const receiveMessage = async (req, res) => {
  try {
    const fromPhone = req.body.From;
    const toPhone = req.body.To;
    const body = req.body.Body;

    const matchedContact = await Contact.findOne({ phone: fromPhone });

    await Message.create({
      userId: matchedContact?.userId || "unknown",
      contactId: matchedContact?._id || null,
      toPhone,
      fromPhone,
      body,
      direction: "inbound",
      status: "received",
      twilioSid: req.body.MessageSid || null,
    });

    res.status(200).send("Inbound message received");
  } catch (error) {
    console.error("Receive message error:", error.message);
    res.status(500).send("Failed to receive inbound message");
  }
};

export const getMessagesByContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const messages = await Message.find({ contactId })
      .sort({ createdAt: 1 })
      .populate("contactId");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error.message);
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
export const deleteMessagesByContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const result = await Message.deleteMany({ contactId });

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting conversation:", error.message);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

