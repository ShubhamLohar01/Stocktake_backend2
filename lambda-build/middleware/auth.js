import { extractTokenFromHeader, verifyToken } from "../utils/auth.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
        return res.status(401).json({ error: "Missing authorization token" });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
    };
    next();
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}
