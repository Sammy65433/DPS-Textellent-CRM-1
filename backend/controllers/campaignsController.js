import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";

const DPS_SCOPE = "user123";
const SEND_UNAVAILABLE =
  "Campaign sending is unavailable until recipient consent is implemented.";

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function editableFields(body = {}) {
  return {
    name: String(body.name ?? "").trim(),
    body: String(body.body ?? "").trim(),
    subject: String(body.subject ?? "").trim(),
    type: body.type || "sms",
    templateId: body.templateId || null,
    contactIds: body.contactIds,
  };
}

async function validateCampaign(fields) {
  if (!fields.name || fields.name.length > 150) {
    return "Enter a valid campaign name.";
  }

  if (!["sms", "email", "both"].includes(fields.type)) {
    return "Choose a valid campaign type.";
  }

  if (fields.body.length > 10000 || fields.subject.length > 200) {
    return "Campaign content is too long.";
  }

  if (!Array.isArray(fields.contactIds) || !fields.contactIds.length) {
    return "Choose at least one contact.";
  }

  if (
    fields.contactIds.length > 500 ||
    fields.contactIds.some((id) => !validId(id))
  ) {
    return "Invalid campaign contacts.";
  }

  const uniqueIds = [...new Set(fields.contactIds.map(String))];

  const count = await Contact.countDocuments({
    _id: { $in: uniqueIds },
    userId: DPS_SCOPE,
  });

  if (count !== uniqueIds.length) {
    return "One or more contacts are unavailable.";
  }

  if (fields.templateId) {
    if (!validId(fields.templateId)) return "Invalid template ID.";

    const template = await Template.exists({
      _id: fields.templateId,
      userId: DPS_SCOPE,
    });

    if (!template) return "Template not found.";
  }

  if (!fields.body && !fields.templateId) {
    return "Enter a message or choose a template.";
  }

  return null;
}

export async function processCampaignSend() {
  throw new Error(SEND_UNAVAILABLE);
}

export async function createCampaign(req, res) {
  try {
    const fields = editableFields(req.body);
    const validationError = await validateCampaign(fields);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const campaign = await Campaign.create({
      ...fields,
      userId: DPS_SCOPE,
      status: "draft",
      scheduledAt: null,
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error("Create campaign failed:", error);
    return res.status(500).json({ error: "Failed to create campaign." });
  }
}

export async function getCampaigns(_req, res) {
  try {
    const campaigns = await Campaign.find({ userId: DPS_SCOPE })
      .sort({ createdAt: -1 })
      .populate("templateId")
      .populate("contactIds");

    return res.json(campaigns);
  } catch (error) {
    console.error("Get campaigns failed:", error);
    return res.status(500).json({ error: "Failed to fetch campaigns." });
  }
}

export async function getCampaignById(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid campaign ID." });
  }

  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: DPS_SCOPE,
    })
      .populate("templateId")
      .populate("contactIds");

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    return res.json(campaign);
  } catch (error) {
    console.error("Get campaign failed:", error);
    return res.status(500).json({ error: "Failed to fetch campaign." });
  }
}

export async function updateCampaign(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid campaign ID." });
  }

  try {
    const existing = await Campaign.findOne({
      _id: req.params.id,
      userId: DPS_SCOPE,
    });

    if (!existing) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    if (existing.status === "sent") {
      return res.status(409).json({ error: "Sent campaigns cannot be edited." });
    }

    const fields = editableFields({
      name: req.body?.name ?? existing.name,
      body: req.body?.body ?? existing.body,
      subject: req.body?.subject ?? existing.subject,
      type: req.body?.type ?? existing.type,
      templateId: req.body?.templateId ?? existing.templateId,
      contactIds: req.body?.contactIds ?? existing.contactIds,
    });

    const validationError = await validateCampaign(fields);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updated = await Campaign.findOneAndUpdate(
      { _id: existing._id, userId: DPS_SCOPE },
      {
        $set: {
          ...fields,
          status: "draft",
          scheduledAt: null,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("templateId")
      .populate("contactIds");

    return res.json(updated);
  } catch (error) {
    console.error("Update campaign failed:", error);
    return res.status(500).json({ error: "Failed to update campaign." });
  }
}

export async function deleteCampaign(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "Invalid campaign ID." });
  }

  try {
    const deleted = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: DPS_SCOPE,
      status: { $ne: "sent" },
    });

    if (!deleted) {
      return res.status(404).json({
        error: "Campaign not found or cannot be deleted.",
      });
    }

    return res.json({ success: true, message: "Campaign deleted." });
  } catch (error) {
    console.error("Delete campaign failed:", error);
    return res.status(500).json({ error: "Failed to delete campaign." });
  }
}

export async function sendCampaign(_req, res) {
  return res.status(503).json({ error: SEND_UNAVAILABLE });
}
