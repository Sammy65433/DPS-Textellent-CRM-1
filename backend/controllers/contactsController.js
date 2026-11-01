import mongoose from "mongoose";
import Contact from "../models/Contact.js";

const DPS_CONTACT_SCOPE = "user123";

const cleanEmail = (value) =>
  String(value ?? "").trim().toLowerCase();

const cleanPhone = (value) =>
  String(value ?? "").replace(/\D/g, "");

function validEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function contactFields(body = {}) {
  return {
    firstName: String(body.firstName ?? "").trim(),
    lastName: String(body.lastName ?? "").trim(),
    phone: cleanPhone(body.phone),
    email: cleanEmail(body.email),
    tags: String(body.tags ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
  };
}

function validateFields(fields) {
  if (!/^\d{7,15}$/.test(fields.phone)) {
    return "Enter a valid phone number.";
  }
  if (!validEmail(fields.email) || fields.email.length > 254) {
    return "Enter a valid email address.";
  }
  if (fields.firstName.length > 100 || fields.lastName.length > 100) {
    return "Contact name is too long.";
  }
  if (fields.tags.length > 500 || fields.notes.length > 5000) {
    return "Tags or notes are too long.";
  }
  return null;
}

export async function createContact(req, res) {
  const fields = contactFields(req.body);
  const validationError = validateFields(fields);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const contact = await Contact.create({
      ...fields,
      userId: DPS_CONTACT_SCOPE,
    });
    return res.status(201).json(contact);
  } catch (error) {
    console.error("Create contact error:", error);
    return res.status(500).json({ error: "Failed to create contact." });
  }
}

export async function getContacts(_req, res) {
  try {
    const contacts = await Contact.find({
      userId: DPS_CONTACT_SCOPE,
    }).sort({ createdAt: -1 });

    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Get contacts error:", error);
    return res.status(500).json({ error: "Failed to fetch contacts." });
  }
}

export async function updateContact(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid contact ID." });
  }

  const fields = contactFields(req.body);
  const validationError = validateFields(fields);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: DPS_CONTACT_SCOPE },
      { $set: fields },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    return res.json(contact);
  } catch (error) {
    console.error("Update contact error:", error);
    return res.status(500).json({ error: "Failed to update contact." });
  }
}

export async function deleteContact(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid contact ID." });
  }

  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: DPS_CONTACT_SCOPE,
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    return res.json({
      success: true,
      message: "Contact deleted successfully.",
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    return res.status(500).json({ error: "Failed to delete contact." });
  }
}

export async function importAppointmentContact(req, res) {
  const appointmentId = String(req.body?.appointmentId || "").trim();

  if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
    return res.status(400).json({ message: "Invalid appointment ID." });
  }

  const apiUrl = process.env.DPS_API_URL?.replace(/\/$/, "");
  const staffKey = process.env.DPS_STAFF_API_KEY;

  if (!apiUrl || !staffKey) {
    return res.status(503).json({
      message: "DPS connection is not configured.",
    });
  }

  try {
    const response = await fetch(`${apiUrl}/api/appointments`, {
      headers: { "X-DPS-Staff-Key": staffKey },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return res.status(502).json({
        message: "Could not verify appointment.",
      });
    }

    const appointments = await response.json();

    if (!Array.isArray(appointments)) {
      return res.status(502).json({
        message: "Unexpected DPS response.",
      });
    }

    const appointment = appointments.find(
      (item) => String(item.id) === appointmentId
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    const fields = {
      firstName: String(appointment.first_name ?? "").trim(),
      lastName: String(appointment.last_name ?? "").trim(),
      phone: cleanPhone(appointment.phone),
      email: cleanEmail(appointment.email),
      tags: "",
      notes: `Imported from DPS appointment ${appointmentId}. Marketing consent not recorded.`,
    };

    const validationError = validateFields(fields);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const conditions = [{ phone: fields.phone }];
    if (fields.email) conditions.push({ email: fields.email });

    const existing = await Contact.findOne({
      userId: DPS_CONTACT_SCOPE,
      $or: conditions,
    });

    if (existing) {
      return res.json({
        created: false,
        contact: existing,
        message: "Contact already exists.",
      });
    }

    const contact = await Contact.create({
      ...fields,
      userId: DPS_CONTACT_SCOPE,
    });

    return res.status(201).json({
      created: true,
      contact,
      message: "Contact added.",
    });
  } catch (error) {
    console.error("Import appointment contact error:", error);
    return res.status(502).json({
      message: "Could not import appointment contact.",
    });
  }
}
