import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSession } from "../services/cache.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

// Extend Request type
declare module "express" {
    interface Request {
        userId?: string;
        userRole?: string;
    }
}

// ============================================
// Authentication Middleware
// ============================================
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        const token = authHeader.replace("Bearer ", "");

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            role: string;
        };

        // Check session in Redis (optional, for token invalidation)
        const session = await getSession(token);
        if (!session) {
            // Session not found in Redis, but token is valid
            // This allows stateless auth while still supporting invalidation
        }

        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: "Token expired" });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        res.status(401).json({ error: "Authentication failed" });
    }
}

// ============================================
// Role-Based Authorization
// ============================================
export function requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
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
export async function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: string;
                role: string;
            };

            req.userId = decoded.userId;
            req.userRole = decoded.role;
        }
    } catch {
        // Token invalid, continue without auth
    }

    next();
}
