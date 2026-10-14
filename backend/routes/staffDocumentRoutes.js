import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";
import Contact from "../models/Contact.js";
import DocumentAccessLog from "../models/DocumentAccessLog.js";

const router = Router();
const CONTACT_SCOPE = "user123";
const MAX_BYTES = 5 * 1024 * 1024;
const DOCUMENT_ID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function linkedCustomerId(contactId) {
  const contact = await Contact.findOne({
    _id: contactId,
    userId: CONTACT_SCOPE,
  }).select("+supabaseCustomerId");

  if (!contact) return { status: 404, message: "Contact not found." };

  if (!contact.supabaseCustomerId) {
    return {
      status: 409,
      message: "This contact has no connected client account.",
    };
  }

  return { customerId: contact.supabaseCustomerId };
}

function dpsConnection() {
  const url = process.env.DPS_API_URL?.replace(/\/$/, "");
  const key = process.env.DPS_STAFF_API_KEY;
  return url && key ? { url, key } : null;
}

async function recordDownloadAttempt(
  req,
  contactId,
  documentId,
  outcome,
  statusCode
) {
  try {
    await DocumentAccessLog.create({
      staffUserId: req.user._id,
      contactId: mongoose.isValidObjectId(contactId) ? contactId : undefined,
      documentId: String(documentId || "invalid").slice(0, 100),
      outcome,
      statusCode,
    });
    return true;
  } catch (error) {
    console.error("Document access audit write failed:", error);
    return false;
  }
}

router.use(requireAuth, requireStaff);

router.get("/contacts/:contactId/documents", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.contactId)) {
    return res.status(400).json({ message: "Invalid contact ID." });
  }

  try {
    const linked = await linkedCustomerId(req.params.contactId);

    if (!linked.customerId) {
      return res.status(linked.status).json({ message: linked.message });
    }

    const dps = dpsConnection();

    if (!dps) {
      return res.status(503).json({
        message: "DPS document connection is unavailable.",
      });
    }

    const upstream = await fetch(
      `${dps.url}/api/staff/documents/${encodeURIComponent(linked.customerId)}`,
      {
        headers: { "X-DPS-Staff-Key": dps.key },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!upstream.ok) {
      console.error("DPS document metadata upstream status:", upstream.status);
      return res.status(502).json({
        message: "Could not load document metadata.",
      });
    }

    const data = await upstream.json();
    res.set("Cache-Control", "no-store");

    return res.json({
      documents: Array.isArray(data.documents) ? data.documents : [],
    });
  } catch (error) {
    console.error("CRM document metadata request failed:", error);
    return res.status(502).json({
      message: "DPS document service unavailable.",
    });
  }
});

router.get(
  "/contacts/:contactId/documents/:documentId/download",
  async (req, res) => {
    const { contactId, documentId } = req.params;

    async function respondWithAudit(status, message, outcome = "failed") {
      await recordDownloadAttempt(
        req,
        contactId,
        documentId,
        outcome,
        status
      );
      return res.status(status).json({ message });
    }

    if (
      !mongoose.isValidObjectId(contactId) ||
      !DOCUMENT_ID_PATTERN.test(documentId)
    ) {
      return respondWithAudit(400, "Invalid document request.", "denied");
    }

    try {
      const linked = await linkedCustomerId(contactId);

      if (!linked.customerId) {
        return respondWithAudit(
          linked.status,
          linked.message,
          "denied"
        );
      }

      const dps = dpsConnection();

      if (!dps) {
        return respondWithAudit(
          503,
          "DPS document connection is unavailable."
        );
      }

      const upstream = await fetch(
        `${dps.url}/api/staff/documents/${encodeURIComponent(linked.customerId)}/${encodeURIComponent(documentId)}/download`,
        {
          headers: { "X-DPS-Staff-Key": dps.key },
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!upstream.ok) {
        console.error("DPS document download upstream status:", upstream.status);

        const messages = {
          404: "Document not found.",
          413: "Document is too large to download.",
        };
        const status = messages[upstream.status] ? upstream.status : 502;

        return respondWithAudit(
          status,
          messages[upstream.status] || "Could not download document.",
          upstream.status === 404 ? "denied" : "failed"
        );
      }

      const lengthHeader = upstream.headers.get("content-length");
      const declaredLength =
        lengthHeader === null ? null : Number(lengthHeader);

      if (
        declaredLength !== null &&
        (!Number.isFinite(declaredLength) ||
          declaredLength < 0 ||
          declaredLength > MAX_BYTES)
      ) {
        await upstream.body?.cancel();
        return respondWithAudit(413, "Document is too large.");
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());

      if (buffer.length > MAX_BYTES) {
        return respondWithAudit(413, "Document is too large.");
      }

      // Fail closed: never send the file if the successful access
      // cannot be recorded.
      const audited = await recordDownloadAttempt(
        req,
        contactId,
        documentId,
        "allowed",
        200
      );

      if (!audited) {
        return res.status(503).json({
          message: "Document audit unavailable. Download blocked.",
        });
      }

      res.set({
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition":
          upstream.headers.get("content-disposition") ||
          'attachment; filename="document"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      });

      return res.send(buffer);
    } catch (error) {
      console.error("CRM document download request failed:", error);
      return respondWithAudit(
        502,
        "DPS document service unavailable."
      );
    }
  }
);

export default router;
