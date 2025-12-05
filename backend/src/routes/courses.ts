import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query, searchFullText } from "../services/db.js";
import { getOrSet, deleteCache } from "../services/cache.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const coursesRouter = Router();

// ============================================
// Validation Schemas
// ============================================
const createCourseSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    category: z.string().min(2),
    tags: z.array(z.string()).optional().default([]),
    thumbnail: z.string().url().optional(),
    published: z.boolean().optional().default(false),
});

const updateCourseSchema = createCourseSchema.partial();

// ============================================
// Get All Courses (Public)
// ============================================
coursesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category, search, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Cache key based on query params
        const cacheKey = `courses:list:${category || "all"}:${search || ""}:${page}:${limit}`;

        const courses = await getOrSet(cacheKey, async () => {
            let queryText = `
        SELECT 
          c.id, c.title, c.description, c.category, c.tags, c.thumbnail,
          c.duration, c.enrolled_count, c.rating, c.created_at,
          u.name as instructor_name, u.avatar as instructor_avatar
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.published = true
      `;

            const params: unknown[] = [];
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
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);
            return result.rows;
        }, 60); // Cache for 1 minute

        res.json({ courses });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Search Courses (Full Text)
// ============================================
coursesRouter.get("/search", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q, limit = "20" } = req.query;

        if (!q) {
            res.status(400).json({ error: "Search query required" });
            return;
        }

        const courses = await searchFullText(
            "courses",
            "title || ' ' || description",
            q as string,
            parseInt(limit as string)
        );

        res.json({ courses });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Single Course
// ============================================
coursesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const course = await getOrSet(`course:${id}`, async () => {
            const result = await query(
                `SELECT 
          c.*, 
          u.name as instructor_name, 
          u.avatar as instructor_avatar,
          u.bio as instructor_bio,
          (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        WHERE c.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            // Get lessons
            const lessonsResult = await query(
                `SELECT id, title, description, duration, type, "order"
         FROM lessons 
         WHERE course_id = $1 
         ORDER BY "order"`,
                [id]
            );

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
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create Course (Instructor only)
// ============================================
coursesRouter.post(
    "/",
    authenticate,
    requireRole(["instructor", "admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = createCourseSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            const result = await query(
                `INSERT INTO courses (
          title, description, category, tags, thumbnail, 
          instructor_id, published, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`,
                [
                    data.title,
                    data.description,
                    data.category,
                    data.tags,
                    data.thumbnail,
                    userId,
                    data.published,
                ]
            );

            // Invalidate cache
            await deleteCache("courses:list:*");

            res.status(201).json({ course: result.rows[0] });
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
// Update Course
// ============================================
coursesRouter.put(
    "/:id",
    authenticate,
    requireRole(["instructor", "admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = updateCourseSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Check ownership
            const ownership = await query(
                "SELECT instructor_id FROM courses WHERE id = $1",
                [id]
            );

            if (ownership.rows.length === 0) {
                res.status(404).json({ error: "Course not found" });
                return;
            }

            if ((ownership.rows[0] as { instructor_id: string }).instructor_id !== userId) {
                res.status(403).json({ error: "Not authorized" });
                return;
            }

            // Build update query dynamically
            const updates: string[] = [];
            const values: unknown[] = [];
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

            const result = await query(
                `UPDATE courses SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
                values
            );

            // Invalidate cache
            await deleteCache(`course:${id}`);
            await deleteCache("courses:list:*");

            res.json({ course: result.rows[0] });
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
// Delete Course
// ============================================
coursesRouter.delete(
    "/:id",
    authenticate,
    requireRole(["instructor", "admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;
            const userRole = (req as Request & { userRole: string }).userRole;

            // Check ownership (admins can delete any)
            const ownership = await query(
                "SELECT instructor_id FROM courses WHERE id = $1",
                [id]
            );

            if (ownership.rows.length === 0) {
                res.status(404).json({ error: "Course not found" });
                return;
            }

            if (
                userRole !== "admin" &&
                (ownership.rows[0] as { instructor_id: string }).instructor_id !== userId
            ) {
                res.status(403).json({ error: "Not authorized" });
                return;
            }

            await query("DELETE FROM courses WHERE id = $1", [id]);

            // Invalidate cache
            await deleteCache(`course:${id}`);
            await deleteCache("courses:list:*");

            res.json({ message: "Course deleted" });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Enroll in Course
// ============================================
coursesRouter.post(
    "/:id/enroll",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;

            // Check if already enrolled
            const existing = await query(
                "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
                [userId, id]
            );

            if (existing.rows.length > 0) {
                res.status(400).json({ error: "Already enrolled" });
                return;
            }

            // Create enrollment
            await query(
                `INSERT INTO enrollments (user_id, course_id, enrolled_at)
         VALUES ($1, $2, NOW())`,
                [userId, id]
            );

            // Increment enrolled count
            await query(
                "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1",
                [id]
            );

            // Invalidate cache
            await deleteCache(`course:${id}`);

            res.status(201).json({ message: "Enrolled successfully" });
        } catch (error) {
            next(error);
        }
    }
);
