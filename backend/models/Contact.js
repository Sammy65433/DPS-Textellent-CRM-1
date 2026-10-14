import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    // Legacy DPS-only scope. Never accept this from browser input.
    userId: {
      type: String,
      required: true,
      immutable: true,
      default: "user123",
    },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100 },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{7,15}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    tags: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, default: "", maxlength: 5000 },
    supabaseCustomerId: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true, strict: "throw" }
);

contactSchema.index(
  { supabaseCustomerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      supabaseCustomerId: { $type: "string" },
    },
  }
);

export default mongoose.model("Contact", contactSchema);
