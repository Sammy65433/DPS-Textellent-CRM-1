import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: "user123" },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Media", mediaSchema);
