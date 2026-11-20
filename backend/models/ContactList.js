import mongoose from "mongoose";

const contactListSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: "user123" },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contact" }],
  },
  { timestamps: true }
);

export default mongoose.model("ContactList", contactListSchema);
