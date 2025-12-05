"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cache_js_1 = require("../services/cache.js");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
// ============================================
// Authentication Middleware
// ============================================
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        const token = authHeader.replace("Bearer ", "");
        // Verify JWT
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check session in Redis (optional, for token invalidation)
        const session = await (0, cache_js_1.getSession)(token);
        if (!session) {
            // Session not found in Redis, but token is valid
            // This allows stateless auth while still supporting invalidation
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: "Token expired" });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        res.status(401).json({ error: "Authentication failed" });
    }
}
// ============================================
// Role-Based Authorization
// ============================================
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.userRole) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        if (!allowedRoles.includes(req.userRole)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }
        next();
    };
}
// ============================================
// Optional Authentication
// ============================================
async function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.userId = decoded.userId;
            req.userRole = decoded.role;
        }
    }
    catch {
        // Token invalid, continue without auth
    }
    next();
}
//# sourceMappingURL=auth.js.map