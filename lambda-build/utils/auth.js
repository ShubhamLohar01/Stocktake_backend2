import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
// Hash password
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
// Compare password
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
// Generate JWT token
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    });
}
// Verify JWT token
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
// Extract token from header
export function extractTokenFromHeader(authHeader) {
    if (!authHeader)
        return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
        return null;
    }
    return parts[1];
}
