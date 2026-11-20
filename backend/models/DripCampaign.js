import mongoose from "mongoose";

const stepSchema = new mongoose.Schema({
  delayDays: { type: Number, default: 0 },
  subject: { type: String, trim: true, default: "" },
  body: { type: String, trim: true, default: "" },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template", default: null },
}, { _id: false });

const dripSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: "user123" },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    steps: { type: [stepSchema], default: [] },
    contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contact" }],
    status: { type: String, enum: ["draft", "active", "paused", "completed"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.model("DripCampaign", dripSchema);
