import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getSession, setCache, getCache, deleteCache } from "../services/cache.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const NODE_ENV = process.env.NODE_ENV || "development";

// Extend Request type
declare module "express" {
    interface Request {
        userId?: string;
        userRole?: string;
    }
}

// ============================================
// Cookie Configuration
// ============================================
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "strict" as const : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
};

export const CSRF_COOKIE_OPTIONS = {
    httpOnly: false, // Accessible by JavaScript
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "strict" as const : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
};

// ============================================
// CSRF Token Generation
// ============================================
export function generateCSRFToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function storeCSRFToken(userId: string, token: string): Promise<void> {
    await setCache(`csrf:${userId}`, token, 7 * 24 * 60 * 60); // 7 days
}

export async function validateCSRFToken(userId: string, token: string): Promise<boolean> {
    const stored = await getCache<string>(`csrf:${userId}`);
    return stored === token;
}

// ============================================
// Authentication Middleware
// Supports both HTTP-only cookies and Bearer token
// ============================================
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Try to get token from HTTP-only cookie first (more secure)
        let token = req.cookies?.auth_token;

        // Fall back to Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                token = authHeader.replace("Bearer ", "");
            }
        }

        if (!token) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            role: string;
        };

        // Check session in Redis for token invalidation support
        const session = await getSession(token);
        if (!session) {
            // Token is valid but session was invalidated (e.g., logout from another device)
            res.status(401).json({ error: "Session expired. Please login again." });
            return;
        }

        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        // Clear invalid cookie if present
        if (req.cookies?.auth_token) {
            res.clearCookie("auth_token", { path: "/" });
            res.clearCookie("csrf_token", { path: "/" });
        }

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
// CSRF Protection Middleware
// ============================================
export async function csrfProtection(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Skip CSRF for safe methods
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        next();
        return;
    }

    // Skip if using Bearer token (API clients)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        next();
        return;
    }

    // For cookie-based auth, verify CSRF token
    if (!req.userId) {
        next();
        return;
    }

    const csrfToken = req.headers["x-csrf-token"] as string;
    if (!csrfToken) {
        res.status(403).json({ error: "CSRF token missing" });
        return;
    }

    const isValid = await validateCSRFToken(req.userId, csrfToken);
    if (!isValid) {
        res.status(403).json({ error: "Invalid CSRF token" });
        return;
    }

    next();
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
            res.status(403).json({
                error: "Insufficient permissions",
                required: allowedRoles,
                current: req.userRole
            });
            return;
        }

        next();
    };
}

// ============================================
// Admin Only Middleware
// ============================================
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.userRole || req.userRole !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
    }
    next();
}

// ============================================
// Instructor or Admin Middleware
// ============================================
export function requireInstructor(req: Request, res: Response, next: NextFunction): void {
    if (!req.userRole || !["instructor", "admin"].includes(req.userRole)) {
        res.status(403).json({ error: "Instructor access required" });
        return;
    }
    next();
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
        // Try cookie first
        let token = req.cookies?.auth_token;

        // Fall back to header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                token = authHeader.replace("Bearer ", "");
            }
        }

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: string;
                role: string;
            };

            // Verify session exists
            const session = await getSession(token);
            if (session) {
                req.userId = decoded.userId;
                req.userRole = decoded.role;
            }
        }
    } catch {
        // Token invalid, continue without auth
    }

    next();
}

// ============================================
// Account Level Checker
// ============================================
export function checkAccountLevel(minLevel: "student" | "instructor" | "admin") {
    const levelOrder = { student: 1, instructor: 2, admin: 3 };

    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.userRole) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        const userLevel = levelOrder[req.userRole as keyof typeof levelOrder] || 0;
        const requiredLevel = levelOrder[minLevel];

        if (userLevel < requiredLevel) {
            res.status(403).json({
                error: `This action requires ${minLevel} level or higher`,
                currentLevel: req.userRole
            });
            return;
        }

        next();
    };
}
