import express from "express";
import {
    sendEmailMessage,
    getEmailMessages,
    getEmailsByContact,
    deleteEmailMessage,
    deleteEmailsByContact,
} from "../controllers/emailsController.js";

const router = express.Router();

router.post("/send", sendEmailMessage);
router.get("/", getEmailMessages);
router.get("/contact/:contactId", getEmailsByContact);
router.delete("/contact/:contactId", deleteEmailsByContact);
router.delete("/:id", deleteEmailMessage);

export default router;
