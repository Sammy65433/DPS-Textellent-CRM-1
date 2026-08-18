import Contact from "../models/Contact.js";
import Template from "../models/Template.js";
import EmailMessage from "../models/EmailMessage.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailMessage = async (req, res) => {
    try {
        const { userId, contactId, toEmail, subject, body, templateId } = req.body || {};
        console.log("EMAIL REQ BODY:", req.body);


        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        let finalToEmail = toEmail;
        let finalBody = body;
        let contact = null;

        if (contactId) {
            contact = await Contact.findById(contactId);

            if (!contact) {
                return res.status(404).json({ error: "Contact not found" });
            }

            if (!finalToEmail) {
                finalToEmail = contact.email;
            }
        }

        if (templateId) {
            const template = await Template.findById(templateId);

            if (!template) {
                return res.status(404).json({ error: "Template not found" });
            }

            if (!finalBody) {
                finalBody = template.body;
            }

            if (contact) {
                finalBody = finalBody
                    .replace(/{{firstName}}/g, contact.firstName || "")
                    .replace(/{{lastName}}/g, contact.lastName || "");
            }
        }


        if (!finalToEmail) {
            return res.status(400).json({ error: "Recipient email or contactId is required" });
        }

        if (!subject) {
            return res.status(400).json({ error: "Email subject is required" });
        }

        if (!finalBody) {
            return res.status(400).json({ error: "Email body or templateId is required" });
        }

        const emailResult = await resend.emails.send({
            from: "DPS CRM <appointments@dpstaxpro.com>",
            to: finalToEmail,
            subject,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${finalBody}</div>`,
        });

        const savedEmail = await EmailMessage.create({
            userId,
            contactId: contactId || null,
            toEmail: finalToEmail,
            subject,
            body: finalBody,
            status: "sent",
            resendId: emailResult?.data?.id || null,
        });

        res.status(200).json({
            success: true,
            message: "Email sent successfully",
            resendId: emailResult?.data?.id || null,
            dbEmail: savedEmail,
        });
    } catch (error) {
        console.error("Send email error:", error.message);
        res.status(500).json({ error: "Failed to send email" });
    }
};

export const getEmailMessages = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const emails = await EmailMessage.find({ userId })
            .sort({ createdAt: -1 })
            .populate("contactId");

        res.status(200).json(emails);
    } catch (error) {
        console.error("Get emails error:", error.message);
        res.status(500).json({ error: "Failed to fetch emails" });
    }
};

export const getEmailsByContact = async (req, res) => {
    try {
        const { contactId } = req.params;

        const emails = await EmailMessage.find({ contactId })
            .sort({ createdAt: 1 })
            .populate("contactId");

        res.status(200).json(emails);
    } catch (error) {
        console.error("Get emails by contact error:", error.message);
        res.status(500).json({ error: "Failed to fetch contact emails" });
    }
};
export const deleteEmailMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEmail = await EmailMessage.findByIdAndDelete(id);

        if (!deletedEmail) {
            return res.status(404).json({ error: "Email not found" });
        }

        res.status(200).json({
            success: true,
            message: "Email deleted successfully",
        });
    } catch (error) {
        console.error("Delete email error:", error.message);
        res.status(500).json({ error: "Failed to delete email" });
    }
};

export const deleteEmailsByContact = async (req, res) => {
    try {
        const { contactId } = req.params;

        const result = await EmailMessage.deleteMany({ contactId });

        res.status(200).json({
            success: true,
            message: "Email conversation deleted successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Delete emails by contact error:", error.message);
        res.status(500).json({ error: "Failed to delete email conversation" });
    }
};

