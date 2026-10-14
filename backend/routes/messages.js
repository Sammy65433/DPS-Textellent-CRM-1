import express from "express";
import {
  sendMessage,
  getMessages,
  receiveMessage,
  getMessagesByContact,
  deleteMessage,
  deleteMessagesByContact,
} from "../controllers/messagesController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

// Twilio cannot use a CRM staff JWT. Verify its signature before enabling
// this endpoint publicly. Do not configure Twilio to call it yet.
router.post("/webhook", receiveMessage);

router.use(requireAuth, requireStaff);

router.post("/send", sendMessage);
router.get("/", getMessages);
router.get("/contact/:contactId", getMessagesByContact);
router.delete("/contact/:contactId", deleteMessagesByContact);
router.delete("/:id", deleteMessage);

export default router;
