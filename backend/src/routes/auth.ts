import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../services/db.js";
import { setSession, deleteSession } from "../services/cache.js";

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

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

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

        // Create session
        await setSession(token, user.id, { role: user.role });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
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
        await setSession(token, user.id, { role: user.role });

        // Update last login
        await query(
            "UPDATE users SET last_login_at = NOW() WHERE id = $1",
            [user.id]
        );

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
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
        await deleteSession(token);
    }

    res.json({ message: "Logged out successfully" });
});

// ============================================
// Refresh Token
// ============================================
authRouter.post("/refresh", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            role: string;
        };

        // Generate new token
        const newToken = jwt.sign(
            { userId: decoded.userId, role: decoded.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Update session
        await deleteSession(token);
        await setSession(newToken, decoded.userId, { role: decoded.role });

        res.json({ token: newToken });
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});

// ============================================
// Get Current User
// ============================================
authRouter.get("/me", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const result = await query(
            "SELECT id, email, name, role, avatar, created_at FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({ user: result.rows[0] });
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});
