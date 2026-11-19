import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";

import Contact from "../models/Contact.js";
import ContactLink from "../models/ContactLink.js";

const router = Router();
const CONTACT_SCOPE = "user123";

function validServerKey(req) {
    const supplied = req.get("X-CRM-Link-Key");
    const expected = process.env.CRM_LINK_REDEEM_KEY;

    if (!supplied || !expected) return false;

    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);

    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post("/redeem", async (req, res) => {
    if (!validServerKey(req)) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const { token, customerId, verifiedEmail, birthday } = req.body ?? {};

    const isObjectId = /^[a-f0-9]{24}$/i.test(customerId);
    const isUuid =
      /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        customerId
      );

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token) ||
        typeof customerId !== "string" ||
        (!isObjectId && !isUuid) ||
        typeof verifiedEmail !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail)
    ) {
        return res.status(400).json({ message: "Invalid link request." });
    }

    const normalizedEmail = verifiedEmail.trim().toLowerCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await mongoose.startSession();

    try {
        let outcome = { status: 500, message: "Could not connect account." };

        await session.withTransaction(async () => {
            const invitation = await ContactLink.findOne({
                tokenHash,
                usedAt: null,
                expiresAt: { $gt: new Date() },
            }).session(session);

            if (!invitation) {
                outcome = { status: 404, message: "Invitation is invalid or expired." };
                return;
            }

            const contact = await Contact.findOne({
                _id: invitation.contactId,
                userId: CONTACT_SCOPE,
            })
                .select("+supabaseCustomerId")
                .session(session);

            if (!contact || contact.supabaseCustomerId) {
                outcome = { status: 409, message: "Contact cannot be linked." };
                return;
            }

            if (
                invitation.recipientEmail !== normalizedEmail ||
                String(contact.email || "").trim().toLowerCase() !==
                invitation.recipientEmail
            ) {
                outcome = {
                    status: 403,
                    message: "Sign in with the invited email address.",
                };
                return;
            }

            const duplicate = await Contact.findOne({
                userId: CONTACT_SCOPE,
                supabaseCustomerId: customerId,
            }).session(session);

            if (duplicate) {
                outcome = { status: 409, message: "Account is already linked." };
                return;
            }

            const claimed = await ContactLink.findOneAndUpdate(
                {
                    _id: invitation._id,
                    usedAt: null,
                    expiresAt: { $gt: new Date() },
                },
                { $set: { usedAt: new Date() } },
                { returnDocument: "after", session }
            );

            if (!claimed) throw new Error("LINK_ALREADY_USED");

            const linked = await Contact.findOneAndUpdate(
                {
                    _id: contact._id,
                    userId: CONTACT_SCOPE,
                    supabaseCustomerId: null,
                    email: invitation.recipientEmail,
                },
                { $set: { supabaseCustomerId: customerId, ...(birthday ? { birthday: new Date(birthday) } : {}) } },
                { returnDocument: "after", session }
            ).select("+supabaseCustomerId");

            if (!linked) throw new Error("CONTACT_NOT_LINKABLE");

            outcome = { status: 200, message: "Customer account connected." };
        });

        return res.status(outcome.status).json({ message: outcome.message });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Account already linked." });
        }

        if (
            ["LINK_ALREADY_USED", "CONTACT_NOT_LINKABLE"].includes(error.message)
        ) {
            return res.status(409).json({
                message: "Invitation cannot be used.",
            });
        }

        console.error("Account-link redemption failed:", error);
        return res.status(500).json({
            message: "Could not connect account.",
        });
    } finally {
        await session.endSession();
    }
});

// Auto-register/upsert a contact when a client creates an account on the DPS site.
// Called by the DPS backend after customer registration.
router.post("/upsert-client", async (req, res) => {
    if (!validServerKey(req)) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const { email, firstName, lastName, phone, birthday, customerId } = req.body ?? {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Valid email required." });
    }

    try {
        let contact = await Contact.findOne({
            userId: CONTACT_SCOPE,
            email: normalizedEmail,
        });

        if (contact) {
            const update = {};
            if (firstName && !contact.firstName) update.firstName = String(firstName).trim();
            if (lastName && !contact.lastName) update.lastName = String(lastName).trim();
            if (phone && !contact.phone) update.phone = String(phone).replace(/\D/g, "");
            if (birthday && !contact.birthday) update.birthday = new Date(birthday);
            if (customerId && !contact.supabaseCustomerId) update.supabaseCustomerId = String(customerId);

            if (Object.keys(update).length > 0) {
                await Contact.updateOne({ _id: contact._id }, { $set: update });
            }

            return res.json({
                message: "Contact updated.",
                contactId: contact._id,
                linked: !!contact.supabaseCustomerId || !!customerId,
            });
        }

        const newContact = await Contact.create({
            userId: CONTACT_SCOPE,
            firstName: String(firstName || "").trim(),
            lastName: String(lastName || "").trim(),
            phone: String(phone || "").replace(/\D/g, ""),
            email: normalizedEmail,
            birthday: birthday ? new Date(birthday) : null,
            tags: "DPS Client",
            notes: "Auto-created from DPS client account registration.",
            supabaseCustomerId: customerId ? String(customerId) : null,
        });

        return res.status(201).json({
            message: "Contact created.",
            contactId: newContact._id,
            linked: !!customerId,
        });
    } catch (error) {
        console.error("Upsert client contact failed:", error);
        return res.status(500).json({ message: "Could not register client contact." });
    }
});

export default router;
