import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ message: "Login required." });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured.");
        return res.status(503).json({ message: "Authentication unavailable." });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload?.id) {
            return res.status(401).json({ message: "Invalid login." });
        }

        const user = await User.findById(payload.id).select("-password");

        if (!user || !user.active) {
            return res.status(401).json({
                message: "Account inactive or not found.",
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
            console.error("Authentication lookup failed:", error);
            return res.status(503).json({ message: "Authentication unavailable." });
        }

        return res.status(401).json({ message: "Invalid or expired login." });
    }
}

export function requireStaff(req, res, next) {
    if (!["staff", "admin"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Staff access required." });
    }

    return next();
}

export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }

    return next();
}
