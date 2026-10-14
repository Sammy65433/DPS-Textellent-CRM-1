import express from "express";
import {
  sendEmailMessage,
  getEmailMessages,
  getEmailsByContact,
  deleteEmailMessage,
  deleteEmailsByContact,
} from "../controllers/emailsController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireStaff);

router.post("/send", sendEmailMessage);
router.get("/", getEmailMessages);
router.get("/contact/:contactId", getEmailsByContact);
router.delete("/contact/:contactId", deleteEmailsByContact);
router.delete("/:id", deleteEmailMessage);

export default router;
