import mongoose from "mongoose";

const autoResponderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: "user123" },
    type: { type: String, enum: ["out_of_office", "after_hours"], required: true },
    active: { type: Boolean, default: false },
    message: { type: String, trim: true, default: "" },
    // out of office: date range
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // after hours: time window (HH:MM) and weekdays
    startTime: { type: String, trim: true, default: "17:00" },
    endTime: { type: String, trim: true, default: "09:00" },
    weekdays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
  },
  { timestamps: true }
);

autoResponderSchema.index({ userId: 1, type: 1 }, { unique: true });

export default mongoose.model("AutoResponder", autoResponderSchema);
