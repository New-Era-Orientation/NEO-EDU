import { Router, type Request, type Response, type NextFunction } from "express";
import { query } from "../services/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const usersRouter = Router();

// ============================================
// Get User Profile
// ============================================
usersRouter.get("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;

        const result = await query(
            `SELECT id, email, name, role, avatar, bio, created_at
       FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Update Profile
// ============================================
usersRouter.put("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;
        const { name, bio, avatar } = req.body;

        const result = await query(
            `UPDATE users 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           avatar = COALESCE($3, avatar),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, name, role, avatar, bio`,
            [name, bio, avatar, userId]
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get User Preferences
// ============================================
usersRouter.get("/preferences", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;

        const result = await query(
            `SELECT preferences FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const preferences = (result.rows[0] as { preferences: Record<string, unknown> }).preferences || {
            language: "vi",
            theme: "system",
            notifications: true
        };

        res.json({ preferences });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Update User Preferences
// ============================================
usersRouter.put("/preferences", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;
        const { language, theme, notifications } = req.body;

        // Build update object with only provided fields
        const updates: Record<string, unknown> = {};
        if (language !== undefined) updates.language = language;
        if (theme !== undefined) updates.theme = theme;
        if (notifications !== undefined) updates.notifications = notifications;

        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: "No preferences to update" });
            return;
        }

        // Use jsonb_set for partial updates
        const result = await query(
            `UPDATE users 
       SET preferences = COALESCE(preferences, '{}')::jsonb || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2
       RETURNING preferences`,
            [JSON.stringify(updates), userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({ preferences: (result.rows[0] as { preferences: Record<string, unknown> }).preferences });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get User's Enrolled Courses
// ============================================
usersRouter.get("/courses", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;

        const result = await query(
            `SELECT 
        c.id, c.title, c.description, c.thumbnail, c.category,
        c.duration, c.rating,
        e.enrolled_at,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id AND completed = true) as completed_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
            [userId]
        );

        const courses = result.rows.map((row: Record<string, unknown>) => ({
            ...row,
            progress: Math.round(
                ((row.completed_lessons as number) /
                    ((row.total_lessons as number) || 1)) * 100
            ),
        }));

        res.json({ courses });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get User's Progress Dashboard
// ============================================
usersRouter.get("/dashboard", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as Request & { userId: string }).userId;

        // Get stats
        const stats = await query(
            `SELECT 
        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1) as enrolled_courses,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true) as completed_lessons,
        (SELECT COALESCE(SUM(time_spent), 0) FROM user_progress WHERE user_id = $1) as total_time_spent`,
            [userId]
        );

        // Get recent activity
        const recentActivity = await query(
            `SELECT 
        up.lesson_id, up.progress, up.completed, up.updated_at,
        l.title as lesson_title,
        c.id as course_id, c.title as course_title
       FROM user_progress up
       JOIN lessons l ON up.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE up.user_id = $1
       ORDER BY up.updated_at DESC
       LIMIT 10`,
            [userId]
        );

        // Get in-progress courses
        const inProgress = await query(
            `SELECT 
        c.id, c.title, c.thumbnail,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id AND completed = true) as completed_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1
       AND (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id AND completed = true) < 
           (SELECT COUNT(*) FROM lessons WHERE course_id = c.id)
       AND (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id) > 0
       LIMIT 5`,
            [userId]
        );

        res.json({
            stats: stats.rows[0],
            recentActivity: recentActivity.rows,
            inProgress: inProgress.rows,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Admin: Get All Users
// ============================================
usersRouter.get(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page = "1", limit = "20", role, search } = req.query;
            const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

            let queryText = `
        SELECT id, email, name, role, avatar, created_at, last_login_at
        FROM users
        WHERE 1=1
      `;

            const params: unknown[] = [];
            let paramIndex = 1;

            if (role) {
                queryText += ` AND role = $${paramIndex}`;
                params.push(role);
                paramIndex++;
            }

            if (search) {
                queryText += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);

            // Get total count
            const countResult = await query(
                "SELECT COUNT(*) as total FROM users",
                []
            );

            res.json({
                users: result.rows,
                total: (countResult.rows[0] as { total: string }).total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Admin: Create User (can create instructor/admin)
// ============================================
usersRouter.post(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name, role, must_change_password = true } = req.body;

            // Validate required fields
            if (!email || !password || !name || !role) {
                res.status(400).json({ error: "Email, password, name and role are required" });
                return;
            }

            // Validate role
            if (!["student", "instructor"].includes(role)) {
                res.status(400).json({ error: "Invalid role. Admin accounts must be created via CLI." });
                return;
            }

            // Check if email exists
            const existing = await query(
                "SELECT id FROM users WHERE email = $1",
                [email]
            );

            if (existing.rows.length > 0) {
                res.status(400).json({ error: "Email already registered" });
                return;
            }

            // Hash password
            const bcrypt = await import("bcrypt");
            const hashedPassword = await bcrypt.default.hash(password, 12);

            // Create user with must_change_password flag
            const result = await query(
                `INSERT INTO users (email, password_hash, name, role, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, name, role, must_change_password, created_at`,
                [email, hashedPassword, name, role, must_change_password]
            );

            res.status(201).json({
                message: "User created successfully",
                user: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    }
);
// ============================================
// Admin: Update User
// ============================================
usersRouter.put(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { name, role, email, password, bio, must_change_password } = req.body;

            // Optional password update
            let hashedPassword;
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (name) {
                updates.push(`name = $${paramIndex++}`);
                values.push(name);
            }
            if (role) {
                updates.push(`role = $${paramIndex++}`);
                values.push(role);
            }
            if (email) {
                updates.push(`email = $${paramIndex++}`);
                values.push(email);
            }
            if (bio !== undefined) {
                updates.push(`bio = $${paramIndex++}`);
                values.push(bio);
            }
            if (must_change_password !== undefined) {
                updates.push(`must_change_password = $${paramIndex++}`);
                values.push(must_change_password);
            }
            if (password) {
                const bcrypt = await import("bcrypt");
                hashedPassword = await bcrypt.default.hash(password, 12);
                updates.push(`password_hash = $${paramIndex++}`);
                values.push(hashedPassword);
            }

            if (updates.length === 0) {
                res.status(400).json({ error: "No fields to update" });
                return;
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const queryText = `
                UPDATE users
                SET ${updates.join(", ")}
                WHERE id = $${paramIndex}
                RETURNING id, email, name, role, must_change_password, updated_at
            `;

            const result = await query(queryText, values);

            if (result.rows.length === 0) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            res.json({ user: result.rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Admin: Delete User
// ============================================
usersRouter.delete(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            // Prevent deleting self
            if (id === (req as any).userId) {
                res.status(400).json({ error: "Cannot delete your own account" });
                return;
            }

            const result = await query(
                "DELETE FROM users WHERE id = $1 RETURNING id",
                [id]
            );

            if (result.rows.length === 0) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            res.json({ message: "User deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
);
