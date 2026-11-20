import mongoose from "mongoose";
import DripCampaign from "../models/DripCampaign.js";
import DripEnrollment from "../models/DripEnrollment.js";
import Contact from "../models/Contact.js";
import Template from "../models/Template.js";
import { Resend } from "resend";

const DPS_SCOPE = "user123";

export async function getDripCampaigns(_req, res) {
  try {
    const drips = await DripCampaign.find({ userId: DPS_SCOPE }).sort({ createdAt: -1 });
    return res.json(drips);
  } catch (error) {
    console.error("Get drip campaigns error:", error);
    return res.status(500).json({ error: "Failed to fetch drip campaigns." });
  }
}

export async function createDripCampaign(req, res) {
  const name = String(req.body?.name ?? "").trim();
  if (!name || name.length > 150) {
    return res.status(400).json({ error: "Enter a valid campaign name." });
  }
  try {
    const drip = await DripCampaign.create({
      userId: DPS_SCOPE,
      name,
      steps: Array.isArray(req.body?.steps) ? req.body.steps : [],
      contactIds: Array.isArray(req.body?.contactIds) ? req.body.contactIds : [],
      status: req.body?.status === "active" ? "active" : "draft",
    });
    return res.status(201).json(drip);
  } catch (error) {
    console.error("Create drip campaign error:", error);
    return res.status(500).json({ error: "Failed to create drip campaign." });
  }
}

export async function updateDripCampaign(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid drip campaign ID." });
  }
  try {
    const drip = await DripCampaign.findOne({ _id: req.params.id, userId: DPS_SCOPE });
    if (!drip) return res.status(404).json({ error: "Drip campaign not found." });
    if (req.body?.name !== undefined) drip.name = String(req.body.name).trim();
    if (Array.isArray(req.body?.steps)) drip.steps = req.body.steps;
    if (Array.isArray(req.body?.contactIds)) drip.contactIds = req.body.contactIds;
    if (req.body?.status) drip.status = req.body.status;
    await drip.save();
    return res.json(drip);
  } catch (error) {
    console.error("Update drip campaign error:", error);
    return res.status(500).json({ error: "Failed to update drip campaign." });
  }
}

export async function deleteDripCampaign(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid drip campaign ID." });
  }
  try {
    const deleted = await DripCampaign.findOneAndDelete({ _id: req.params.id, userId: DPS_SCOPE });
    if (!deleted) return res.status(404).json({ error: "Drip campaign not found." });
    await DripEnrollment.deleteMany({ dripId: req.params.id });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete drip campaign error:", error);
    return res.status(500).json({ error: "Failed to delete drip campaign." });
  }
}

export async function enrollContacts(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid drip campaign ID." });
  }
  try {
    const drip = await DripCampaign.findOne({ _id: req.params.id, userId: DPS_SCOPE });
    if (!drip) return res.status(404).json({ error: "Drip campaign not found." });
    const ids = Array.isArray(req.body?.contactIds) ? req.body.contactIds : drip.contactIds;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: "No contacts to enroll." });
    }
    const now = new Date();
    const firstDelay = drip.steps.length > 0 ? (drip.steps[0].delayDays || 0) : 0;
    const nextSendAt = new Date(now.getTime() + firstDelay * 86400000);

    let enrolled = 0;
    for (const cid of ids) {
      if (!mongoose.isValidObjectId(cid)) continue;
      try {
        await DripEnrollment.create({ dripId: drip._id, contactId: cid, currentStep: 0, nextSendAt, status: "active" });
        enrolled++;
      } catch (e) {
        // duplicate enrollment, skip
      }
    }
    if (drip.status === "draft") {
      drip.status = "active";
      await drip.save();
    }
    return res.json({ enrolled });
  } catch (error) {
    console.error("Enroll contacts error:", error);
    return res.status(500).json({ error: "Failed to enroll contacts." });
  }
}

// Process due enrollments (called by scheduler)
export async function processDripEnrollments() {
  try {
    const now = new Date();
    const due = await DripEnrollment.find({ status: "active", nextSendAt: { $lte: now } });
    for (const enr of due) {
      const drip = await DripCampaign.findById(enr.dripId);
      if (!drip || drip.status !== "active") {
        enr.status = "cancelled";
        await enr.save();
        continue;
      }
      const step = drip.steps[enr.currentStep];
      if (!step) {
        enr.status = "completed";
        await enr.save();
        continue;
      }
      const contact = await Contact.findById(enr.contactId);
      if (!contact) {
        enr.status = "cancelled";
        await enr.save();
        continue;
      }

      // resolve body
      let subject = step.subject || "";
      let body = step.body || "";
      if (step.templateId) {
        const tpl = await Template.findById(step.templateId);
        if (tpl) {
          subject = subject || tpl.name;
          body = body || tpl.body;
        }
      }
      // personalize
      const firstName = contact.firstName || "";
      const lastName = contact.lastName || "";
      body = body.replace(/{{firstName}}/g, firstName).replace(/{{lastName}}/g, lastName).replace(/{{fullName}}/g, `${firstName} ${lastName}`.trim());
      subject = subject.replace(/{{firstName}}/g, firstName).replace(/{{lastName}}/g, lastName);

      if (contact.email && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "campaigns@dpstaxpro.com",
            to: contact.email,
            subject: subject || "DPS Update",
            html: body.replace(/\n/g, "<br/>"),
          });
        } catch (e) {
          console.error("Drip email failed:", e);
        }
      }

      // advance
      const nextStep = enr.currentStep + 1;
      if (nextStep < drip.steps.length) {
        const nextDelay = drip.steps[nextStep].delayDays || 0;
        enr.currentStep = nextStep;
        enr.nextSendAt = new Date(now.getTime() + nextDelay * 86400000);
        await enr.save();
      } else {
        enr.status = "completed";
        await enr.save();
      }
    }
  } catch (error) {
    console.error("Process drip enrollments error:", error);
  }
}
