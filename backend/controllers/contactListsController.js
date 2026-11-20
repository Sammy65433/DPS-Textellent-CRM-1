import mongoose from "mongoose";
import ContactList from "../models/ContactList.js";

const DPS_SCOPE = "user123";

export async function getContactLists(_req, res) {
  try {
    const lists = await ContactList.find({ userId: DPS_SCOPE }).sort({ createdAt: -1 });
    return res.json(lists);
  } catch (error) {
    console.error("Get contact lists error:", error);
    return res.status(500).json({ error: "Failed to fetch contact lists." });
  }
}

export async function createContactList(req, res) {
  const name = String(req.body?.name ?? "").trim();
  if (!name || name.length > 100) {
    return res.status(400).json({ error: "Enter a valid list name." });
  }
  try {
    const list = await ContactList.create({ userId: DPS_SCOPE, name, contactIds: [] });
    return res.status(201).json(list);
  } catch (error) {
    console.error("Create contact list error:", error);
    return res.status(500).json({ error: "Failed to create contact list." });
  }
}

export async function updateContactList(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid list ID." });
  }
  try {
    const list = await ContactList.findOne({ _id: req.params.id, userId: DPS_SCOPE });
    if (!list) return res.status(404).json({ error: "List not found." });

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name || name.length > 100) return res.status(400).json({ error: "Enter a valid list name." });
      list.name = name;
    }
    if (Array.isArray(req.body?.contactIds)) {
      list.contactIds = req.body.contactIds.filter(mongoose.isValidObjectId);
    }
    await list.save();
    return res.json(list);
  } catch (error) {
    console.error("Update contact list error:", error);
    return res.status(500).json({ error: "Failed to update contact list." });
  }
}

export async function deleteContactList(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid list ID." });
  }
  try {
    const deleted = await ContactList.findOneAndDelete({ _id: req.params.id, userId: DPS_SCOPE });
    if (!deleted) return res.status(404).json({ error: "List not found." });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete contact list error:", error);
    return res.status(500).json({ error: "Failed to delete contact list." });
  }
}
