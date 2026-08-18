import Template from "../models/Template.js";

export const createTemplate = async (req, res) => {
    try {
        const { userId, name, body } = req.body;

        if (!userId || !name || !body) {
            return res.status(400).json({
                error: "userId, name, and body are required",
            });
        }

        const template = await Template.create({
            userId,
            name,
            body,
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("Create template error:", error.message);
        res.status(500).json({ error: "Failed to create template" });
    }
};

export const getTemplates = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const templates = await Template.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(templates);
    } catch (error) {
        console.error("Get templates error:", error.message);
        res.status(500).json({ error: "Failed to fetch templates" });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Template.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: "Template not found" });
        }

        res.status(200).json({ success: true, message: "Template deleted" });
    } catch (error) {
        console.error("Delete template error:", error.message);
        res.status(500).json({ error: "Failed to delete template" });
    }
};
