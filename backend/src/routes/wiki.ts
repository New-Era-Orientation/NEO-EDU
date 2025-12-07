import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query } from "../services/db.js";
import { getOrSet, deleteCache } from "../services/cache.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const wikiRouter = Router();

// ============================================
// Validation Schemas
// ============================================
const createWikiSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
    content: z.string().optional(),
    excerpt: z.string().max(500).optional(),
    is_published: z.boolean().optional().default(false),
});

const updateWikiSchema = createWikiSchema.partial();

// ============================================
// Get All Published Wikis (Public)
// ============================================
wikiRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const cacheKey = `wikis:public:${search || "all"}:${page}:${limit}`;

        const wikis = await getOrSet(cacheKey, async () => {
            let queryText = `
                SELECT w.id, w.title, w.slug, w.excerpt, w.created_at, w.updated_at,
                       u.name as author_name
                FROM wikis w
                LEFT JOIN users u ON w.author_id = u.id
                WHERE w.is_published = true
            `;

            const params: unknown[] = [];
            let paramIndex = 1;

            if (search) {
                queryText += ` AND (w.title ILIKE $${paramIndex} OR w.content ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            queryText += ` ORDER BY w.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);
            return result.rows;
        }, 60); // Cache for 1 minute

        res.json({ wikis });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get All Wikis (Admin)
// ============================================
wikiRouter.get("/admin", authenticate, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let queryText = `
            SELECT w.id, w.title, w.slug, w.excerpt, w.is_published, w.created_at, w.updated_at,
                   u.name as author_name
            FROM wikis w
            LEFT JOIN users u ON w.author_id = u.id
            WHERE 1=1
        `;

        const params: unknown[] = [];
        let paramIndex = 1;

        if (search) {
            queryText += ` AND (w.title ILIKE $${paramIndex} OR w.content ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY w.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), offset);

        const result = await query(queryText, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM wikis WHERE 1=1`;
        const countParams: unknown[] = [];
        if (search) {
            countQuery += ` AND (title ILIKE $1 OR content ILIKE $1)`;
            countParams.push(`%${search}%`);
        }
        const countResult = await query(countQuery, countParams);

        res.json({
            wikis: result.rows,
            total: parseInt((countResult.rows[0] as { total: string }).total),
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Single Wiki by Slug (Public)
// ============================================
wikiRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;

        const wiki = await getOrSet(`wiki:${slug}`, async () => {
            const result = await query(
                `SELECT w.*, u.name as author_name
                 FROM wikis w
                 LEFT JOIN users u ON w.author_id = u.id
                 WHERE w.slug = $1 AND w.is_published = true`,
                [slug]
            );
            return result.rows[0] || null;
        }, 300); // Cache for 5 minutes

        if (!wiki) {
            res.status(404).json({ error: "Wiki article not found" });
            return;
        }

        res.json({ wiki });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Single Wiki by ID (Admin)
// ============================================
wikiRouter.get("/admin/:id", authenticate, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT w.*, u.name as author_name
             FROM wikis w
             LEFT JOIN users u ON w.author_id = u.id
             WHERE w.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Wiki article not found" });
            return;
        }

        res.json({ wiki: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create Wiki (Admin only)
// ============================================
wikiRouter.post(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = createWikiSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            const result = await query(
                `INSERT INTO wikis (title, slug, content, excerpt, is_published, author_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [data.title, data.slug, data.content || null, data.excerpt || null, data.is_published, userId]
            );

            // Invalidate cache
            await deleteCache("wikis:public:*");

            res.status(201).json({ wiki: result.rows[0] });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Validation failed", details: error.errors });
                return;
            }
            // Handle unique constraint violation for slug
            if ((error as NodeJS.ErrnoException).code === "23505") {
                res.status(409).json({ error: "A wiki with this slug already exists" });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Update Wiki (Admin only)
// ============================================
wikiRouter.put(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = updateWikiSchema.parse(req.body);

            // Check if wiki exists
            const existing = await query(`SELECT * FROM wikis WHERE id = $1`, [id]);
            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Wiki article not found" });
                return;
            }

            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            if (data.title !== undefined) {
                updates.push(`title = $${paramIndex}`);
                values.push(data.title);
                paramIndex++;
            }
            if (data.slug !== undefined) {
                updates.push(`slug = $${paramIndex}`);
                values.push(data.slug);
                paramIndex++;
            }
            if (data.content !== undefined) {
                updates.push(`content = $${paramIndex}`);
                values.push(data.content);
                paramIndex++;
            }
            if (data.excerpt !== undefined) {
                updates.push(`excerpt = $${paramIndex}`);
                values.push(data.excerpt);
                paramIndex++;
            }
            if (data.is_published !== undefined) {
                updates.push(`is_published = $${paramIndex}`);
                values.push(data.is_published);
                paramIndex++;
            }

            if (updates.length === 0) {
                res.status(400).json({ error: "No updates provided" });
                return;
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const result = await query(
                `UPDATE wikis SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
                values
            );

            // Invalidate cache
            const oldSlug = (existing.rows[0] as { slug: string }).slug;
            await deleteCache(`wiki:${oldSlug}`);
            if (data.slug && data.slug !== oldSlug) {
                await deleteCache(`wiki:${data.slug}`);
            }
            await deleteCache("wikis:public:*");

            res.json({ wiki: result.rows[0] });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Validation failed", details: error.errors });
                return;
            }
            if ((error as NodeJS.ErrnoException).code === "23505") {
                res.status(409).json({ error: "A wiki with this slug already exists" });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Delete Wiki (Admin only)
// ============================================
wikiRouter.delete(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const existing = await query(`SELECT slug FROM wikis WHERE id = $1`, [id]);
            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Wiki article not found" });
                return;
            }

            await query(`DELETE FROM wikis WHERE id = $1`, [id]);

            // Invalidate cache
            const slug = (existing.rows[0] as { slug: string }).slug;
            await deleteCache(`wiki:${slug}`);
            await deleteCache("wikis:public:*");

            res.json({ message: "Wiki deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
);
