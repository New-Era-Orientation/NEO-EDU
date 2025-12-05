"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_js_1 = require("../services/db.js");
const cache_js_1 = require("../services/cache.js");
exports.authRouter = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// ============================================
// Validation Schemas
// ============================================
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2).max(100),
    role: zod_1.z.enum(["student", "instructor"]).optional().default("student"),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// ============================================
// Register
// ============================================
exports.authRouter.post("/register", async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        // Check if email exists
        const existing = await (0, db_js_1.query)("SELECT id FROM users WHERE email = $1", [data.email]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "Email already registered" });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        // Create user
        const result = await (0, db_js_1.query)(`INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, email, name, role, created_at`, [data.email, hashedPassword, data.name, data.role]);
        const user = result.rows[0];
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Create session
        await (0, cache_js_1.setSession)(token, user.id, { role: user.role });
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.errors });
            return;
        }
        next(error);
    }
});
// ============================================
// Login
// ============================================
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);
        // Find user
        const result = await (0, db_js_1.query)("SELECT id, email, name, role, password_hash, avatar FROM users WHERE email = $1", [data.email]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const user = result.rows[0];
        // Verify password
        const validPassword = await bcrypt_1.default.compare(data.password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Create session
        await (0, cache_js_1.setSession)(token, user.id, { role: user.role });
        // Update last login
        await (0, db_js_1.query)("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.errors });
            return;
        }
        next(error);
    }
});
// ============================================
// Logout
// ============================================
exports.authRouter.post("/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
        await (0, cache_js_1.deleteSession)(token);
    }
    res.json({ message: "Logged out successfully" });
});
// ============================================
// Refresh Token
// ============================================
exports.authRouter.post("/refresh", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Generate new token
        const newToken = jsonwebtoken_1.default.sign({ userId: decoded.userId, role: decoded.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Update session
        await (0, cache_js_1.deleteSession)(token);
        await (0, cache_js_1.setSession)(newToken, decoded.userId, { role: decoded.role });
        res.json({ token: newToken });
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});
// ============================================
// Get Current User
// ============================================
exports.authRouter.get("/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const result = await (0, db_js_1.query)("SELECT id, email, name, role, avatar, created_at FROM users WHERE id = $1", [decoded.userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user: result.rows[0] });
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});
//# sourceMappingURL=auth.js.map