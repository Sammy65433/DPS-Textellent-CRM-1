import express from "express";
import {
    sendMessage,
    getMessages,
    receiveMessage,
    getMessagesByContact,
    deleteMessage,
    deleteMessagesByContact,
} from "../controllers/messagesController.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/", getMessages);
router.get("/contact/:contactId", getMessagesByContact);
router.post("/webhook", receiveMessage);
router.delete("/contact/:contactId", deleteMessagesByContact);
router.delete("/:id", deleteMessage);

export default router;
