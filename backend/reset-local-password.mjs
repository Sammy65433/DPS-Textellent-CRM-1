import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import User from "./models/User.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const email = (await rl.question("CRM staff email: ")).trim().toLowerCase();
  const password = await rl.question("New password (12+ characters): ");

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email });
  if (!user) throw new Error("Staff account not found.");

  user.password = await bcrypt.hash(password, 12);
  await user.save();

  console.log("Password reset completed for the selected staff account.");
} catch (error) {
  console.error("Reset failed:", error.message);
} finally {
  await mongoose.disconnect();
  rl.close();
}
