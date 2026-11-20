import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    dripId: { type: mongoose.Schema.Types.ObjectId, ref: "DripCampaign", required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true },
    currentStep: { type: Number, default: 0 },
    nextSendAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

enrollmentSchema.index({ dripId: 1, contactId: 1 }, { unique: true });

export default mongoose.model("DripEnrollment", enrollmentSchema);
