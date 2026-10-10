import express from "express";
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  importAppointmentContact,
} from "../controllers/contactsController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireStaff);

router.post("/", createContact);
router.get("/", getContacts);
router.post("/from-appointment", importAppointmentContact);
router.patch("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
