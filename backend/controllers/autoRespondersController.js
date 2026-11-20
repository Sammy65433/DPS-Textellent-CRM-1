import mongoose from "mongoose";
import AutoResponder from "../models/AutoResponder.js";

const DPS_SCOPE = "user123";
const TYPES = ["out_of_office", "after_hours", "birthday"];

export async function getAutoResponders(_req, res) {
  try {
    const items = await AutoResponder.find({ userId: DPS_SCOPE });
    // ensure both types exist
    const result = [];
    for (const t of TYPES) {
      let item = items.find((i) => i.type === t);
      if (!item) {
        item = await AutoResponder.create({ userId: DPS_SCOPE, type: t });
      }
      result.push(item);
    }
    return res.json(result);
  } catch (error) {
    console.error("Get auto responders error:", error);
    return res.status(500).json({ error: "Failed to fetch auto responders." });
  }
}

export async function updateAutoResponder(req, res) {
  const type = req.params.type;
  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: "Invalid auto responder type." });
  }
  try {
    let item = await AutoResponder.findOne({ userId: DPS_SCOPE, type });
    if (!item) item = await AutoResponder.create({ userId: DPS_SCOPE, type });
    if (req.body?.active !== undefined) item.active = !!req.body.active;
    if (req.body?.channels !== undefined && ["sms","email","both"].includes(req.body.channels)) item.channels = req.body.channels;
    if (req.body?.message !== undefined) item.message = String(req.body.message ?? "").trim();
    if (req.body?.smsMessage !== undefined) item.smsMessage = String(req.body.smsMessage ?? "").trim();
    if (req.body?.emailMessage !== undefined) item.emailMessage = String(req.body.emailMessage ?? "").trim();
    if (req.body?.startDate !== undefined) item.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (req.body?.endDate !== undefined) item.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body?.startTime !== undefined) item.startTime = String(req.body.startTime ?? "").trim();
    if (req.body?.endTime !== undefined) item.endTime = String(req.body.endTime ?? "").trim();
    if (Array.isArray(req.body?.weekdays)) item.weekdays = req.body.weekdays;
    if (req.body?.sendTime !== undefined) item.sendTime = String(req.body.sendTime ?? "").trim();
    await item.save();
    return res.json(item);
  } catch (error) {
    console.error("Update auto responder error:", error);
    return res.status(500).json({ error: "Failed to update auto responder." });
  }
}
