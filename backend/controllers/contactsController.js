import mongoose from "mongoose";
import Contact from "../models/Contact.js";

const DPS_CONTACT_SCOPE = "user123";

const cleanEmail = (value) =>
    String(value ?? "").trim().toLowerCase();

const cleanPhone = (value) =>
    String(value ?? "").replace(/\D/g, "");

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

export async function createContact(req, res) {
    try {
        const fields = contactFields(req.body);

        if (!fields.phone) {
            return res.status(400).json({ error: "Phone is required." });
        }

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

export async function getContacts(req, res) {
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
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid contact ID." });
    }

    try {
        // Allowlist ordinary editable fields. Never copy req.body directly.
        const fields = contactFields(req.body);

        if (!fields.phone) {
            return res.status(400).json({ error: "Phone is required." });
        }

        const updatedContact = await Contact.findOneAndUpdate(
            { _id: id, userId: DPS_CONTACT_SCOPE },
            { $set: fields },
            { new: true, runValidators: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ error: "Contact not found." });
        }

        return res.status(200).json(updatedContact);
    } catch (error) {
        console.error("Update contact error:", error);
        return res.status(500).json({ error: "Failed to update contact." });
    }
}

export async function deleteContact(req, res) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid contact ID." });
    }

    try {
        const deletedContact = await Contact.findOneAndDelete({
            _id: id,
            userId: DPS_CONTACT_SCOPE,
        });

        if (!deletedContact) {
            return res.status(404).json({ error: "Contact not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully.",
        });
    } catch (error) {
        console.error("Delete contact error:", error);
        return res.status(500).json({ error: "Failed to delete contact." });
    }
}

export async function importAppointmentContact(req, res) {
    const appointmentId = Number(req.body?.appointmentId);

    if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
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
            (item) => Number(item.id) === appointmentId
        );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found.",
            });
        }

        const phone = cleanPhone(appointment.phone);
        const email = cleanEmail(appointment.email);

        if (!phone) {
            return res.status(400).json({
                message: "Appointment has no valid phone number.",
            });
        }

        const conditions = [{ phone }];
        if (email) conditions.push({ email });

        const existing = await Contact.findOne({
            userId: DPS_CONTACT_SCOPE,
            $or: conditions,
        });

        if (existing) {
            return res.status(200).json({
                created: false,
                contact: existing,
                message: "Contact already exists.",
            });
        }

        const contact = await Contact.create({
            userId: DPS_CONTACT_SCOPE,
            firstName: String(appointment.first_name ?? "").trim(),
            lastName: String(appointment.last_name ?? "").trim(),
            phone,
            email,
            tags: "",
            notes: `Imported from DPS appointment ${appointmentId}. Marketing consent not recorded.`,
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
