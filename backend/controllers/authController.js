import bcrypt from "bcryptjs";
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
