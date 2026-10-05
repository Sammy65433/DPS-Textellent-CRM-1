import Contact from "../models/Contact.js";

const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanPhone = (value) => String(value || "").replace(/\D/g, "");

export const createContact = async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, email, tags, notes } =
            req.body;

        if (!userId || !phone) {
            return res.status(400).json({
                error: "userId and phone are required",
            });
        }

        const contact = await Contact.create({
            userId,
            firstName,
            lastName,
            phone,
            email,
            tags,
            notes,
        });

        return res.status(201).json(contact);
    } catch (error) {
        console.error("Create contact error:", error);
        return res.status(500).json({ error: "Failed to create contact" });
    }
};

export const getContacts = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const contacts = await Contact.find({ userId }).sort({
            createdAt: -1,
        });

        return res.status(200).json(contacts);
    } catch (error) {
        console.error("Get contacts error:", error);
        return res.status(500).json({ error: "Failed to fetch contacts" });
    }
};

export const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, email, tags, notes } = req.body;

        const updatedContact = await Contact.findByIdAndUpdate(
            id,
            { firstName, lastName, phone, email, tags, notes },
            { returnDocument: "after" }
        );

        if (!updatedContact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        return res.status(200).json(updatedContact);
    } catch (error) {
        console.error("Update contact error:", error);
        return res.status(500).json({ error: "Failed to update contact" });
    }
};

export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedContact = await Contact.findByIdAndDelete(id);

        if (!deletedContact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
        });
    } catch (error) {
        console.error("Delete contact error:", error);
        return res.status(500).json({ error: "Failed to delete contact" });
    }
};

export const importAppointmentContact = async (req, res) => {
    const appointmentId = Number(req.body?.appointmentId);

    if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
        return res.status(400).json({ message: "Invalid appointment ID." });
    }

    if (!process.env.DPS_API_URL || !process.env.DPS_STAFF_API_KEY) {
        return res.status(503).json({
            message: "DPS connection is not configured.",
        });
    }

    try {
        const response = await fetch(
            `${process.env.DPS_API_URL}/api/appointments`,
            {
                headers: {
                    "X-DPS-Staff-Key": process.env.DPS_STAFF_API_KEY,
                },
                signal: AbortSignal.timeout(60000),
            }
        );

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

        // Current CRM uses "user123" for its contact list.
        // Migrate all CRM routes to authenticated user IDs before changing this.
        const userId = "user123";

        const conditions = [{ phone }];

        if (email) conditions.push({ email });

        const existing = await Contact.findOne({
            userId,
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
            userId,
            firstName: appointment.first_name || "",
            lastName: appointment.last_name || "",
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
};
