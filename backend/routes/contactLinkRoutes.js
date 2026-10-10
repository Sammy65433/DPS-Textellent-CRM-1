import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";
import Contact from "../models/Contact.js";

const router = Router();

router.use(requireAuth, requireStaff);

/*
  Placeholder only. Do not mount this route yet.

  The finished POST /:contactId/request endpoint must:
  1. Validate contactId and find the contact in the authorized DPS scope.
  2. Generate a random token with crypto.randomBytes(32).
  3. Store only SHA-256(token), its expiry, contactId, and req.user._id.
  4. Send the raw token only in a customer-facing email link.
  5. Apply rate limiting and avoid logging the token or link.
*/
router.post("/:contactId/request", async (req, res) => {
  const { contactId } = req.params;

  if (!mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ message: "Invalid contact ID." });
  }

  const contact = await Contact.findOne({
    _id: contactId,
    userId: "user123",
  }).select("+supabaseCustomerId");

  if (!contact) {
    return res.status(404).json({ message: "Contact not found." });
  }

  if (contact.supabaseCustomerId) {
    return res.status(409).json({ message: "Contact already linked." });
  }

  return res.status(501).json({
    message: "Account-link invitation is not implemented yet.",
  });
});

export default router;
