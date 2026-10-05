import express from "express";
import {
    createContact,
    getContacts,
    updateContact,
    deleteContact,
} from "../controllers/contactsController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";
import { importAppointmentContact } from "../controllers/contactsController.js";

const router = express.Router();

router.post("/", createContact);
router.get("/", getContacts);
router.post(
  "/from-appointment",
  requireAuth,
  requireStaff,
  importAppointmentContact
);

router.patch("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
