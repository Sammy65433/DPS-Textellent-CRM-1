import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";
import Message from "../models/Message.js";
import EmailMessage from "../models/EmailMessage.js";
import { sendSms } from "../services/twilioService.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export const processCampaignSend = async campaign => {
    const contacts = await Contact.find({
        _id: { $in: campaign.contactIds },
    });

    if (!contacts.length) return [];

    const populatedCampaign = await Campaign.findById(campaign._id).populate("templateId");

    const results = [];

    for (const contact of contacts) {
        let finalBody = populatedCampaign.body;

        if (populatedCampaign.templateId && !finalBody) {
            finalBody = populatedCampaign.templateId.body;
        }

        finalBody = finalBody
            .replace(/{{firstName}}/g, contact.firstName || "")
            .replace(/{{lastName}}/g, contact.lastName || "");

        if (populatedCampaign.type === "sms" || populatedCampaign.type === "both") {
            if (contact.phone) {
                const twilioMessage = await sendSms(contact.phone, finalBody);

                const savedMessage = await Message.create({
                    userId: populatedCampaign.userId,
                    contactId: contact._id,
                    toPhone: contact.phone,
                    fromPhone: process.env.TWILIO_PHONE_NUMBER,
                    body: finalBody,
                    direction: "outbound",
                    status: twilioMessage.status || "sent",
                    twilioSid: twilioMessage.sid,
                });

                results.push({
                    channel: "sms",
                    contactId: contact._id,
                    phone: contact.phone,
                    twilioSid: twilioMessage.sid,
                    messageId: savedMessage._id,
                });
            }
        }

        if (populatedCampaign.type === "email" || populatedCampaign.type === "both") {
            if (contact.email) {
                const subject =
                    populatedCampaign.subject || "Message from DPS CRM";

                const emailResult = await resend.emails.send({
                    from: "DPS CRM <appointments@dpstaxpro.com>",
                    to: contact.email,
                    subject,
                    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${finalBody}</div>`,
                });

                const savedEmail = await EmailMessage.create({
                    userId: populatedCampaign.userId,
                    contactId: contact._id,
                    toEmail: contact.email,
                    subject,
                    body: finalBody,
                    status: "sent",
                    resendId: emailResult?.data?.id || null,
                });

                results.push({
                    channel: "email",
                    contactId: contact._id,
                    email: contact.email,
                    resendId: emailResult?.data?.id || null,
                    emailId: savedEmail._id,
                });
            }
        }
    }

    campaign.status = "sent";
    await campaign.save();

    return results;
};



export const createCampaign = async (req, res) => {
    try {
        const {
            userId,
            name,
            body,
            subject,
            type,
            templateId,
            contactIds,
            scheduledAt,
        } = req.body;

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

        const hasSchedule = !!scheduledAt;

        const campaign = await Campaign.create({
            userId,
            name,
            body: body || "",
            subject: subject || "",
            type: type || "sms",
            templateId: templateId || null,
            contactIds,
            scheduledAt: hasSchedule ? new Date(scheduledAt) : null,
            status: hasSchedule ? "scheduled" : "draft",
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error("Create campaign error:", error.message);
        res.status(500).json({ error: "Failed to create campaign" });
    }
};
export const sendCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const results = await processCampaignSend(campaign);

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
        const {
            name,
            body,
            subject,
            type,
            templateId,
            contactIds,
            status,
            scheduledAt,
        } = req.body;

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            {
                name,
                body,
                subject,
                type,
                templateId,
                contactIds,
                status,
                scheduledAt,
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
