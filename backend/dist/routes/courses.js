"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_js_1 = require("../services/db.js");
const cache_js_1 = require("../services/cache.js");
const auth_js_1 = require("../middleware/auth.js");
exports.coursesRouter = (0, express_1.Router)();
// ============================================
// Validation Schemas
// ============================================
const createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(10),
    category: zod_1.z.string().min(2),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    thumbnail: zod_1.z.string().url().optional(),
    published: zod_1.z.boolean().optional().default(false),
});
const updateCourseSchema = createCourseSchema.partial();
// ============================================
// Get All Courses (Public)
// ============================================
exports.coursesRouter.get("/", async (req, res, next) => {
    try {
        const { category, search, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        // Cache key based on query params
        const cacheKey = `courses:list:${category || "all"}:${search || ""}:${page}:${limit}`;
        const courses = await (0, cache_js_1.getOrSet)(cacheKey, async () => {
            let queryText = `
        SELECT 
          c.id, c.title, c.description, c.category, c.tags, c.thumbnail,
          c.duration, c.enrolled_count, c.rating, c.created_at,
          u.name as instructor_name, u.avatar as instructor_avatar
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.published = true
      `;
            const params = [];
            let paramIndex = 1;
            if (category) {
                queryText += ` AND c.category = $${paramIndex}`;
                params.push(category);
                paramIndex++;
            }
            if (search) {
                queryText += ` AND (
          to_tsvector('english', c.title || ' ' || c.description) @@ 
          plainto_tsquery('english', $${paramIndex})
        )`;
                params.push(search);
                paramIndex++;
            }
            queryText += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);
            const result = await (0, db_js_1.query)(queryText, params);
            return result.rows;
        }, 60); // Cache for 1 minute
        res.json({ courses });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Search Courses (Full Text)
// ============================================
exports.coursesRouter.get("/search", async (req, res, next) => {
    try {
        const { q, limit = "20" } = req.query;
        if (!q) {
            res.status(400).json({ error: "Search query required" });
            return;
        }
        const courses = await (0, db_js_1.searchFullText)("courses", "title || ' ' || description", q, parseInt(limit));
        res.json({ courses });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Get Single Course
// ============================================
exports.coursesRouter.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await (0, cache_js_1.getOrSet)(`course:${id}`, async () => {
            const result = await (0, db_js_1.query)(`SELECT 
          c.*, 
          u.name as instructor_name, 
          u.avatar as instructor_avatar,
          u.bio as instructor_bio,
          (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.id = $1`, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            // Get lessons
            const lessonsResult = await (0, db_js_1.query)(`SELECT id, title, description, duration, type, "order"
         FROM lessons 
         WHERE course_id = $1 
         ORDER BY "order"`, [id]);
            return {
                ...result.rows[0],
                lessons: lessonsResult.rows,
            };
        }, 300); // Cache for 5 minutes
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        res.json({ course });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Create Course (Instructor only)
// ============================================
exports.coursesRouter.post("/", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["instructor", "admin"]), async (req, res, next) => {
    try {
        const data = createCourseSchema.parse(req.body);
        const userId = req.userId;
        const result = await (0, db_js_1.query)(`INSERT INTO courses (
          title, description, category, tags, thumbnail, 
          instructor_id, published, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`, [
            data.title,
            data.description,
            data.category,
            data.tags,
            data.thumbnail,
            userId,
            data.published,
        ]);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)("courses:list:*");
        res.status(201).json({ course: result.rows[0] });
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
// Update Course
// ============================================
exports.coursesRouter.put("/:id", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["instructor", "admin"]), async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = updateCourseSchema.parse(req.body);
        const userId = req.userId;
        // Check ownership
        const ownership = await (0, db_js_1.query)("SELECT instructor_id FROM courses WHERE id = $1", [id]);
        if (ownership.rows.length === 0) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        if (ownership.rows[0].instructor_id !== userId) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            res.status(400).json({ error: "No updates provided" });
            return;
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, db_js_1.query)(`UPDATE courses SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`, values);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)(`course:${id}`);
        await (0, cache_js_1.deleteCache)("courses:list:*");
        res.json({ course: result.rows[0] });
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
// Delete Course
// ============================================
exports.coursesRouter.delete("/:id", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["instructor", "admin"]), async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;
        // Check ownership (admins can delete any)
        const ownership = await (0, db_js_1.query)("SELECT instructor_id FROM courses WHERE id = $1", [id]);
        if (ownership.rows.length === 0) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        if (userRole !== "admin" &&
            ownership.rows[0].instructor_id !== userId) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        await (0, db_js_1.query)("DELETE FROM courses WHERE id = $1", [id]);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)(`course:${id}`);
        await (0, cache_js_1.deleteCache)("courses:list:*");
        res.json({ message: "Course deleted" });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Enroll in Course
// ============================================
exports.coursesRouter.post("/:id/enroll", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if already enrolled
        const existing = await (0, db_js_1.query)("SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2", [userId, id]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "Already enrolled" });
            return;
        }
        // Create enrollment
        await (0, db_js_1.query)(`INSERT INTO enrollments (user_id, course_id, enrolled_at)
         VALUES ($1, $2, NOW())`, [userId, id]);
        // Increment enrolled count
        await (0, db_js_1.query)("UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1", [id]);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)(`course:${id}`);
        res.status(201).json({ message: "Enrolled successfully" });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=courses.js.map