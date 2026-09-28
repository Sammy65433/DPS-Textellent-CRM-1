import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Login required." });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Account not found." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired login." });
    }
}
export function requireStaff(req, res, next) {
    if (!["staff", "admin"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Staff access required." });
    }
    next();
}
