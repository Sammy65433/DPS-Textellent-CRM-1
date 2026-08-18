import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";
import Message from "../models/Message.js";
import { sendSms } from "../services/twilioService.js";

export const createCampaign = async (req, res) => {
    try {
        const { userId, name, body, templateId, contactIds } = req.body;

        if (!userId || !name || !contactIds || contactIds.length === 0) {
            return res.status(400).json({
                error: "userId, name, and contactIds are required",
            });
        }

        if (!body && !templateId) {
            return res.status(400).json({
                error: "body or templateId is required",
            });
        }

        const campaign = await Campaign.create({
            userId,
            name,
            body: body || "",
            templateId: templateId || null,
            contactIds,
            status: "draft",
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error("Create campaign error:", error.message);
        res.status(500).json({ error: "Failed to create campaign" });
    }
};

export const getCampaigns = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const campaigns = await Campaign.find({ userId })
            .sort({ createdAt: -1 })
            .populate("templateId")
            .populate("contactIds");

        res.status(200).json(campaigns);
    } catch (error) {
        console.error("Get campaigns error:", error.message);
        res.status(500).json({ error: "Failed to fetch campaigns" });
    }
};

export const sendCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findById(id).populate("templateId");

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const contacts = await Contact.find({
            _id: { $in: campaign.contactIds },
        });

        if (!contacts.length) {
            return res.status(404).json({ error: "No contacts found for campaign" });
        }

        const results = [];

        for (const contact of contacts) {
            let finalBody = campaign.body;

            if (campaign.templateId && !finalBody) {
                finalBody = campaign.templateId.body;
            }

            finalBody = finalBody
                .replace(/{{firstName}}/g, contact.firstName || "")
                .replace(/{{lastName}}/g, contact.lastName || "");

            const twilioMessage = await sendSms(contact.phone, finalBody);

            const savedMessage = await Message.create({
                userId: campaign.userId,
                contactId: contact._id,
                toPhone: contact.phone,
                fromPhone: process.env.TWILIO_PHONE_NUMBER,
                body: finalBody,
                direction: "outbound",
                status: twilioMessage.status || "sent",
                twilioSid: twilioMessage.sid,
            });

            results.push({
                contactId: contact._id,
                phone: contact.phone,
                twilioSid: twilioMessage.sid,
                messageId: savedMessage._id,
            });
        }

        campaign.status = "sent";
        await campaign.save();

        res.status(200).json({
            success: true,
            message: "Campaign sent successfully",
            campaignId: campaign._id,
            sentCount: results.length,
            results,
        });
    } catch (error) {
        console.error("Send campaign error:", error.message);
        res.status(500).json({ error: "Failed to send campaign" });
    }
};
export const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findById(id)
            .populate("templateId")
            .populate("contactIds");

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.status(200).json(campaign);
    } catch (error) {
        console.error("Get campaign by id error:", error.message);
        res.status(500).json({ error: "Failed to fetch campaign" });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, body, templateId, contactIds, status } = req.body;

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            {
                name,
                body,
                templateId,
                contactIds,
                status,
            },
            { returnDocument: "after" }
        )
            .populate("templateId")
            .populate("contactIds");

        if (!updatedCampaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.status(200).json(updatedCampaign);
    } catch (error) {
        console.error("Update campaign error:", error.message);
        res.status(500).json({ error: "Failed to update campaign" });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCampaign = await Campaign.findByIdAndDelete(id);

        if (!deletedCampaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.status(200).json({
            success: true,
            message: "Campaign deleted successfully",
        });
    } catch (error) {
        console.error("Delete campaign error:", error.message);
        res.status(500).json({ error: "Failed to delete campaign" });
    }
};
