import express from "express";
import {
  getContactLists,
  createContactList,
  updateContactList,
  deleteContactList,
} from "../controllers/contactListsController.js";
import { requireAuth, requireStaff } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth, requireStaff);

router.get("/", getContactLists);
router.post("/", createContactList);
router.patch("/:id", updateContactList);
router.delete("/:id", deleteContactList);

export default router;
