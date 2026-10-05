import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function generateToken(id) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ id: String(id) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export const registerUser = (_req, res) => {
  return res.status(403).json({
    message: "Public registration is disabled. Contact an administrator.",
  });
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.active !== true) {
      return res.status(403).json({
        message: "Account setup is required before login.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export async function setupPassword(req, res) {
  const token = req.body?.token;
  const password = req.body?.password;

  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof password !== "string" ||
    password.length < 12
  ) {
    return res.status(400).json({
      message:
        "Valid setup link and a password of at least 12 characters are required.",
    });
  }

  try {
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      setupTokenHash: hash,
      setupTokenExpiresAt: { $gt: new Date() },
      active: false,
    }).select("+setupTokenHash +setupTokenExpiresAt");

    if (!user) {
      return res.status(400).json({
        message: "Setup link is invalid or expired.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.active = true;
    user.setupTokenHash = undefined;
    user.setupTokenExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password set. You can now log in." });
  } catch (error) {
    console.error("Password setup failed:", error);
    return res.status(500).json({ message: "Could not set password." });
  }
}
