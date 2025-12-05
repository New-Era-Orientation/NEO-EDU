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

        const courses = result.rows.map((row) => ({
            ...(row as Record<string, unknown>),
            progress: Math.round(
                (((row as Record<string, unknown>).completed_lessons as number) /
                    ((row as Record<string, unknown>).total_lessons as number || 1)) * 100
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
