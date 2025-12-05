"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const db_js_1 = require("../services/db.js");
const auth_js_1 = require("../middleware/auth.js");
exports.usersRouter = (0, express_1.Router)();
// ============================================
// Get User Profile
// ============================================
exports.usersRouter.get("/profile", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await (0, db_js_1.query)(`SELECT id, email, name, role, avatar, bio, created_at
       FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user: result.rows[0] });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Update Profile
// ============================================
exports.usersRouter.put("/profile", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const { name, bio, avatar } = req.body;
        const result = await (0, db_js_1.query)(`UPDATE users 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           avatar = COALESCE($3, avatar),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, name, role, avatar, bio`, [name, bio, avatar, userId]);
        res.json({ user: result.rows[0] });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Get User's Enrolled Courses
// ============================================
exports.usersRouter.get("/courses", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await (0, db_js_1.query)(`SELECT 
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
       ORDER BY e.enrolled_at DESC`, [userId]);
        const courses = result.rows.map((row) => ({
            ...row,
            progress: Math.round((row.completed_lessons /
                (row.total_lessons || 1)) * 100),
        }));
        res.json({ courses });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Get User's Progress Dashboard
// ============================================
exports.usersRouter.get("/dashboard", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        // Get stats
        const stats = await (0, db_js_1.query)(`SELECT 
        (SELECT COUNT(*) FROM enrollments WHERE user_id = $1) as enrolled_courses,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true) as completed_lessons,
        (SELECT COALESCE(SUM(time_spent), 0) FROM user_progress WHERE user_id = $1) as total_time_spent`, [userId]);
        // Get recent activity
        const recentActivity = await (0, db_js_1.query)(`SELECT 
        up.lesson_id, up.progress, up.completed, up.updated_at,
        l.title as lesson_title,
        c.id as course_id, c.title as course_title
       FROM user_progress up
       JOIN lessons l ON up.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE up.user_id = $1
       ORDER BY up.updated_at DESC
       LIMIT 10`, [userId]);
        // Get in-progress courses
        const inProgress = await (0, db_js_1.query)(`SELECT 
        c.id, c.title, c.thumbnail,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id AND completed = true) as completed_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1
       AND (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id AND completed = true) < 
           (SELECT COUNT(*) FROM lessons WHERE course_id = c.id)
       AND (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND course_id = c.id) > 0
       LIMIT 5`, [userId]);
        res.json({
            stats: stats.rows[0],
            recentActivity: recentActivity.rows,
            inProgress: inProgress.rows,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Admin: Get All Users
// ============================================
exports.usersRouter.get("/", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["admin"]), async (req, res, next) => {
    try {
        const { page = "1", limit = "20", role, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let queryText = `
        SELECT id, email, name, role, avatar, created_at, last_login_at
        FROM users
        WHERE 1=1
      `;
        const params = [];
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
        params.push(parseInt(limit), offset);
        const result = await (0, db_js_1.query)(queryText, params);
        // Get total count
        const countResult = await (0, db_js_1.query)("SELECT COUNT(*) as total FROM users", []);
        res.json({
            users: result.rows,
            total: countResult.rows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=users.js.map