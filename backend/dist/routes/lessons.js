"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_js_1 = require("../services/db.js");
const cache_js_1 = require("../services/cache.js");
const auth_js_1 = require("../middleware/auth.js");
exports.lessonsRouter = (0, express_1.Router)();
// ============================================
// Validation Schemas
// ============================================
const createLessonSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().optional(),
    content: zod_1.z.string(),
    videoUrl: zod_1.z.string().url().optional(),
    duration: zod_1.z.number().min(0),
    type: zod_1.z.enum(["video", "text", "quiz", "assignment"]),
    order: zod_1.z.number().int().min(0),
});
const updateLessonSchema = createLessonSchema.omit({ courseId: true }).partial();
// ============================================
// Get Lessons for Course
// ============================================
exports.lessonsRouter.get("/course/:courseId", async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const lessons = await (0, cache_js_1.getOrSet)(`lessons:course:${courseId}`, async () => {
            const result = await (0, db_js_1.query)(`SELECT id, title, description, duration, type, "order", created_at
         FROM lessons 
         WHERE course_id = $1 
         ORDER BY "order"`, [courseId]);
            return result.rows;
        }, 300);
        res.json({ lessons });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Get Single Lesson
// ============================================
exports.lessonsRouter.get("/:id", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const lesson = await (0, cache_js_1.getOrSet)(`lesson:${id}`, async () => {
            const result = await (0, db_js_1.query)(`SELECT l.*, c.instructor_id
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         WHERE l.id = $1`, [id]);
            return result.rows[0] || null;
        }, 300);
        if (!lesson) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        // Check enrollment (skip for instructors)
        const lessonData = lesson;
        if (lessonData.instructor_id !== userId) {
            const enrollment = await (0, db_js_1.query)("SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2", [userId, lessonData.course_id]);
            if (enrollment.rows.length === 0) {
                res.status(403).json({ error: "Not enrolled in this course" });
                return;
            }
        }
        // Get user progress for this lesson
        const progress = await (0, db_js_1.query)("SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2", [userId, id]);
        res.json({
            lesson,
            progress: progress.rows[0] || null,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// Create Lesson
// ============================================
exports.lessonsRouter.post("/", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["instructor", "admin"]), async (req, res, next) => {
    try {
        const data = createLessonSchema.parse(req.body);
        const userId = req.userId;
        // Verify course ownership
        const course = await (0, db_js_1.query)("SELECT instructor_id FROM courses WHERE id = $1", [data.courseId]);
        if (course.rows.length === 0) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        if (course.rows[0].instructor_id !== userId) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        const result = await (0, db_js_1.query)(`INSERT INTO lessons (
          course_id, title, description, content, video_url, 
          duration, type, "order", created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`, [
            data.courseId,
            data.title,
            data.description,
            data.content,
            data.videoUrl,
            data.duration,
            data.type,
            data.order,
        ]);
        // Update course duration
        await (0, db_js_1.query)(`UPDATE courses 
         SET duration = (SELECT SUM(duration) FROM lessons WHERE course_id = $1),
             updated_at = NOW()
         WHERE id = $1`, [data.courseId]);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)(`lessons:course:${data.courseId}`);
        await (0, cache_js_1.deleteCache)(`course:${data.courseId}`);
        res.status(201).json({ lesson: result.rows[0] });
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
// Update Lesson
// ============================================
exports.lessonsRouter.put("/:id", auth_js_1.authenticate, (0, auth_js_1.requireRole)(["instructor", "admin"]), async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = updateLessonSchema.parse(req.body);
        const userId = req.userId;
        // Check ownership
        const lesson = await (0, db_js_1.query)(`SELECT l.course_id, c.instructor_id 
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         WHERE l.id = $1`, [id]);
        if (lesson.rows.length === 0) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        const lessonData = lesson.rows[0];
        if (lessonData.instructor_id !== userId) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        // Build update query
        const updates = [];
        const values = [];
        let paramIndex = 1;
        const fieldMap = {
            videoUrl: "video_url",
        };
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                const dbField = fieldMap[key] || key;
                updates.push(`"${dbField}" = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            res.status(400).json({ error: "No updates provided" });
            return;
        }
        updates.push("updated_at = NOW()");
        values.push(id);
        const result = await (0, db_js_1.query)(`UPDATE lessons SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`, values);
        // Invalidate cache
        await (0, cache_js_1.deleteCache)(`lesson:${id}`);
        await (0, cache_js_1.deleteCache)(`lessons:course:${lessonData.course_id}`);
        res.json({ lesson: result.rows[0] });
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
// Update Progress
// ============================================
exports.lessonsRouter.post("/:id/progress", auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { progress, completed, timeSpent } = req.body;
        // Get course ID
        const lesson = await (0, db_js_1.query)("SELECT course_id FROM lessons WHERE id = $1", [id]);
        if (lesson.rows.length === 0) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        const courseId = lesson.rows[0].course_id;
        // Upsert progress
        const result = await (0, db_js_1.query)(`INSERT INTO user_progress (user_id, lesson_id, course_id, progress, completed, time_spent, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, lesson_id) 
         DO UPDATE SET 
           progress = EXCLUDED.progress,
           completed = EXCLUDED.completed,
           time_spent = user_progress.time_spent + EXCLUDED.time_spent,
           updated_at = NOW()
         RETURNING *`, [userId, id, courseId, progress, completed, timeSpent || 0]);
        res.json({ progress: result.rows[0] });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=lessons.js.map