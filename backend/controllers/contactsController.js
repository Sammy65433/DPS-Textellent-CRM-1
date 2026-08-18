import Contact from "../models/Contact.js";

export const createContact = async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, email, tags } = req.body;

        if (!userId || !phone) {
            return res.status(400).json({ error: "userId and phone are required" });
        }

        const contact = await Contact.create({
            userId,
            firstName,
            lastName,
            phone,
            email,
            tags,
        });

        res.status(201).json(contact);
    } catch (error) {
        console.error("Create contact error:", error.message);
        res.status(500).json({ error: "Failed to create contact" });
    }
};

export const getContacts = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const contacts = await Contact.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(contacts);
    } catch (error) {
        console.error("Get contacts error:", error.message);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
};

export const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, email, tags } = req.body;

        const updatedContact = await Contact.findByIdAndUpdate(
            id,
            {
                firstName,
                lastName,
                phone,
                email,
                tags,
            },
            { returnDocument: "after" }
        );

        if (!updatedContact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        res.status(200).json(updatedContact);
    } catch (error) {
        console.error("Update contact error:", error.message);
        res.status(500).json({ error: "Failed to update contact" });
    }
};

export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedContact = await Contact.findByIdAndDelete(id);

        if (!deletedContact) {
            return res.status(404).json({ error: "Contact not found" });
        }

        res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
        });
    } catch (error) {
        console.error("Delete contact error:", error.message);
        res.status(500).json({ error: "Failed to delete contact" });
    }
};
