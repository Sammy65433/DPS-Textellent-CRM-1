import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["staff", "admin"] },
    active: { type: Boolean, default: false },
    setupTokenHash: { type: String, select: false },
    setupTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
