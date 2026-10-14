import mongoose from "mongoose";

const documentAccessLogSchema = new mongoose.Schema(
  {
    staffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      immutable: true,
    },

    documentId: {
      type: String,
      required: true,
      immutable: true,
    },
    outcome: {
      type: String,
      enum: ["allowed", "denied", "failed"],
      required: true,
      immutable: true,
    },
    statusCode: {
      type: Number,
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: "throw",
  }
);

documentAccessLogSchema.index({ createdAt: -1 });
documentAccessLogSchema.index({ staffUserId: 1, createdAt: -1 });
documentAccessLogSchema.index({ contactId: 1, createdAt: -1 });

export default mongoose.model("DocumentAccessLog", documentAccessLogSchema);
