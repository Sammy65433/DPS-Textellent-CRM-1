import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    staffUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staffEmail: { type: String, trim: true, lowercase: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: String, trim: true },
    details: { type: String, trim: true },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
