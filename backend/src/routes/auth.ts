import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../services/db.js";
import { setSession, deleteSession } from "../services/cache.js";
import {
    COOKIE_OPTIONS,
    CSRF_COOKIE_OPTIONS,
    generateCSRFToken,
    storeCSRFToken,
    authenticate,
} from "../middleware/auth.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

// ============================================
// Validation Schemas
// ============================================
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).max(100),
    role: z.enum(["student", "instructor"]).optional().default("student"),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// ============================================
// Helper: Set Auth Cookies
// ============================================
async function setAuthCookies(
    res: Response,
    user: { id: string; role: string },
    token: string
) {
    // Set HTTP-only auth cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    // Generate and set CSRF token (non-httpOnly so JS can read it)
    const csrfToken = generateCSRFToken();
    await storeCSRFToken(user.id, csrfToken);
    res.cookie("csrf_token", csrfToken, CSRF_COOKIE_OPTIONS);

    return csrfToken;
}

// ============================================
// Register
// ============================================
authRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if email exists
        const existing = await query(
            "SELECT id FROM users WHERE email = $1",
            [data.email]
        );

        if (existing.rows.length > 0) {
            res.status(400).json({ error: "Email already registered" });
            return;
        }

        // Hash password with stronger cost factor
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, email, name, role, created_at`,
            [data.email, hashedPassword, data.name, data.role]
        );

        const user = result.rows[0] as {
            id: string;
            email: string;
            name: string;
            role: string;
        };

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create session in Redis
        await setSession(token, user.id, { role: user.role });

        // Set cookies
        const csrfToken = await setAuthCookies(res, user, token);

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token, // Also return token for mobile apps / API clients
            csrfToken, // Return CSRF token for SPA
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.errors });
            return;
        }
        next(error);
    }
});

// ============================================
// Login
// ============================================
authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const result = await query(
            "SELECT id, email, name, role, password_hash, avatar FROM users WHERE email = $1",
            [data.email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        const user = result.rows[0] as {
            id: string;
            email: string;
            name: string;
            role: string;
            password_hash: string;
            avatar: string | null;
        };

        // Verify password
        const validPassword = await bcrypt.compare(data.password, user.password_hash);

        if (!validPassword) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create session
        await setSession(token, user.id, {
            role: user.role,
            loginAt: new Date().toISOString(),
            userAgent: req.headers["user-agent"] || "unknown",
        });

        // Update last login
        await query(
            "UPDATE users SET last_login_at = NOW() WHERE id = $1",
            [user.id]
        );

        // Set cookies
        const csrfToken = await setAuthCookies(res, user, token);

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            },
            token,
            csrfToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.errors });
            return;
        }
        next(error);
    }
});

// ============================================
// Logout
// ============================================
authRouter.post("/logout", async (req: Request, res: Response) => {
    // Get token from cookie or header
    const token = req.cookies?.auth_token ||
        req.headers.authorization?.replace("Bearer ", "");

    if (token) {
        await deleteSession(token);
    }

    // Clear cookies
    res.clearCookie("auth_token", { path: "/" });
    res.clearCookie("csrf_token", { path: "/" });

    res.json({ message: "Logged out successfully" });
});

// ============================================
// Refresh Token
// ============================================
authRouter.post("/refresh", authenticate, async (req: Request, res: Response) => {
    try {
        const oldToken = req.cookies?.auth_token ||
            req.headers.authorization?.replace("Bearer ", "");

        if (!oldToken || !req.userId || !req.userRole) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        // Generate new token
        const newToken = jwt.sign(
            { userId: req.userId, role: req.userRole },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Delete old session and create new one
        await deleteSession(oldToken);
        await setSession(newToken, req.userId, { role: req.userRole });

        // Set new cookies
        const csrfToken = await setAuthCookies(
            res,
            { id: req.userId, role: req.userRole },
            newToken
        );

        res.json({ token: newToken, csrfToken });
    } catch {
        res.status(401).json({ error: "Failed to refresh token" });
    }
});

// ============================================
// Get Current User
// ============================================
authRouter.get("/me", authenticate, async (req: Request, res: Response) => {
    try {
        const result = await query(
            "SELECT id, email, name, role, avatar, created_at FROM users WHERE id = $1",
            [req.userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({ user: result.rows[0] });
    } catch {
        res.status(500).json({ error: "Failed to get user" });
    }
});

// ============================================
// Check Auth Status (for frontend)
// ============================================
authRouter.get("/status", async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.auth_token;

        if (!token) {
            res.json({ authenticated: false });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

        const result = await query(
            "SELECT id, email, name, role, avatar FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            res.json({ authenticated: false });
            return;
        }

        res.json({
            authenticated: true,
            user: result.rows[0],
            csrfToken: req.cookies?.csrf_token,
        });
    } catch {
        // Clear invalid cookies
        res.clearCookie("auth_token", { path: "/" });
        res.clearCookie("csrf_token", { path: "/" });
        res.json({ authenticated: false });
    }
});
