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

export async function getMe(req, res) {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Get me failed:", error);
    return res.status(500).json({ message: "Could not load account." });
  }
}
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

export async function forgotPassword(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const user = await User.findOne({ email }).select("+resetTokenHash +resetTokenExpiresAt");

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

      user.resetTokenHash = resetTokenHash;
      user.resetTokenExpiresAt = resetTokenExpiresAt;
      await user.save();

      if (process.env.RESEND_API_KEY && process.env.CRM_FRONTEND_URL) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const resetLink = `${process.env.CRM_FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;
          await resend.emails.send({
            from: "support@dpstaxpro.com",
            to: user.email,
            subject: "Reset your DPS CRM password",
            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.6">
                <h2>Reset Your Password</h2>
                <p>Hello ${user.name},</p>
                <p>Click the link below to reset your password (expires in 1 hour):</p>
                <p><a href="${resetLink}">Reset Password</a></p>
                <p>If you didn't request this, ignore this email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error("Reset email failed:", emailErr);
        }
      }
    }

    return res.json({ message: "If the account exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Could not process request." });
  }
}

export async function resetPassword(req, res) {
  const token = String(req.body?.token ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ message: "Invalid reset token." });
  }
  if (password.length < 12) {
    return res.status(400).json({ message: "Password must be at least 12 characters." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    }).select("+resetTokenHash +resetTokenExpiresAt");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password reset. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Could not reset password." });
  }
}
