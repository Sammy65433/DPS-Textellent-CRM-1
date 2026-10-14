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

    const { token, customerId, verifiedEmail } = req.body ?? {};

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token) ||
        typeof customerId !== "string" ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(customerId) ||
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
                { $set: { supabaseCustomerId: customerId } },
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

export default router;
