import mongoose from "mongoose";
import Template from "../models/Template.js";

const DPS_SCOPE = "user123";

export async function createTemplate(req, res) {
  const name = String(req.body?.name ?? "").trim();
  const body = String(req.body?.body ?? "").trim();

  if (!name || name.length > 150 || !body || body.length > 10000) {
    return res.status(400).json({
      error: "Enter a valid template name and body.",
    });
  }

  try {
    const template = await Template.create({
      userId: DPS_SCOPE,
      name,
      body,
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error("Create template error:", error);
    return res.status(500).json({ error: "Failed to create template." });
  }
}

export async function getTemplates(_req, res) {
  try {
    const templates = await Template.find({
      userId: DPS_SCOPE,
    }).sort({ createdAt: -1 });

    return res.json(templates);
  } catch (error) {
    console.error("Get templates error:", error);
    return res.status(500).json({ error: "Failed to fetch templates." });
  }
}

export async function deleteTemplate(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid template ID." });
  }

  try {
    const deleted = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: DPS_SCOPE,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Template not found." });
    }

    return res.json({ success: true, message: "Template deleted." });
  } catch (error) {
    console.error("Delete template error:", error);
    return res.status(500).json({ error: "Failed to delete template." });
  }
}
