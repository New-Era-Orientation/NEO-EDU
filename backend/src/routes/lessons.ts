import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query } from "../services/db.js";
import { getOrSet, deleteCache } from "../services/cache.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const lessonsRouter = Router();

// ============================================
// Validation Schemas
// ============================================
const createLessonSchema = z.object({
    courseId: z.string().uuid(),
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    content: z.string(),
    videoUrl: z.string().url().optional(),
    duration: z.number().min(0),
    type: z.enum(["video", "text", "quiz", "assignment"]),
    order: z.number().int().min(0),
});

const updateLessonSchema = createLessonSchema.omit({ courseId: true }).partial();

// ============================================
// Get Lessons for Course
// ============================================
lessonsRouter.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;

        const lessons = await getOrSet(`lessons:course:${courseId}`, async () => {
            const result = await query(
                `SELECT id, title, description, duration, type, "order", created_at
         FROM lessons 
         WHERE course_id = $1 
         ORDER BY "order"`,
                [courseId]
            );
            return result.rows;
        }, 300);

        res.json({ lessons });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Single Lesson
// ============================================
lessonsRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as Request & { userId: string }).userId;

        const lesson = await getOrSet(`lesson:${id}`, async () => {
            const result = await query(
                `SELECT l.*, c.instructor_id
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         WHERE l.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        }, 300);

        if (!lesson) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }

        // Check enrollment (skip for instructors)
        const lessonData = lesson as { course_id: string; instructor_id: string };
        if (lessonData.instructor_id !== userId) {
            const enrollment = await query(
                "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
                [userId, lessonData.course_id]
            );

            if (enrollment.rows.length === 0) {
                res.status(403).json({ error: "Not enrolled in this course" });
                return;
            }
        }

        // Get user progress for this lesson
        const progress = await query(
            "SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2",
            [userId, id]
        );

        res.json({
            lesson,
            progress: progress.rows[0] || null,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create Lesson
// ============================================
lessonsRouter.post(
    "/",
    authenticate,
    requireRole(["instructor", "admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = createLessonSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Verify course ownership
            const course = await query(
                "SELECT instructor_id FROM courses WHERE id = $1",
                [data.courseId]
            );

            if (course.rows.length === 0) {
                res.status(404).json({ error: "Course not found" });
                return;
            }

            if ((course.rows[0] as { instructor_id: string }).instructor_id !== userId) {
                res.status(403).json({ error: "Not authorized" });
                return;
            }

            const result = await query(
                `INSERT INTO lessons (
          course_id, title, description, content, video_url, 
          duration, type, "order", created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
                [
                    data.courseId,
                    data.title,
                    data.description,
                    data.content,
                    data.videoUrl,
                    data.duration,
                    data.type,
                    data.order,
                ]
            );

            // Update course duration
            await query(
                `UPDATE courses 
         SET duration = (SELECT SUM(duration) FROM lessons WHERE course_id = $1),
             updated_at = NOW()
         WHERE id = $1`,
                [data.courseId]
            );

            // Invalidate cache
            await deleteCache(`lessons:course:${data.courseId}`);
            await deleteCache(`course:${data.courseId}`);

            res.status(201).json({ lesson: result.rows[0] });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Validation failed", details: error.errors });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Update Lesson
// ============================================
lessonsRouter.put(
    "/:id",
    authenticate,
    requireRole(["instructor", "admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = updateLessonSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Check ownership
            const lesson = await query(
                `SELECT l.course_id, c.instructor_id 
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         WHERE l.id = $1`,
                [id]
            );

            if (lesson.rows.length === 0) {
                res.status(404).json({ error: "Lesson not found" });
                return;
            }

            const lessonData = lesson.rows[0] as { course_id: string; instructor_id: string };
            if (lessonData.instructor_id !== userId) {
                res.status(403).json({ error: "Not authorized" });
                return;
            }

            // Build update query
            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            const fieldMap: Record<string, string> = {
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

            const result = await query(
                `UPDATE lessons SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
                values
            );

            // Invalidate cache
            await deleteCache(`lesson:${id}`);
            await deleteCache(`lessons:course:${lessonData.course_id}`);

            res.json({ lesson: result.rows[0] });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Validation failed", details: error.errors });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Update Progress
// ============================================
lessonsRouter.post(
    "/:id/progress",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;
            const { progress, completed, timeSpent } = req.body;

            // Get course ID
            const lesson = await query(
                "SELECT course_id FROM lessons WHERE id = $1",
                [id]
            );

            if (lesson.rows.length === 0) {
                res.status(404).json({ error: "Lesson not found" });
                return;
            }

            const courseId = (lesson.rows[0] as { course_id: string }).course_id;

            // Upsert progress
            const result = await query(
                `INSERT INTO user_progress (user_id, lesson_id, course_id, progress, completed, time_spent, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, lesson_id) 
         DO UPDATE SET 
           progress = EXCLUDED.progress,
           completed = EXCLUDED.completed,
           time_spent = user_progress.time_spent + EXCLUDED.time_spent,
           updated_at = NOW()
         RETURNING *`,
                [userId, id, courseId, progress, completed, timeSpent || 0]
            );

            res.json({ progress: result.rows[0] });
        } catch (error) {
            next(error);
        }
    }
);
