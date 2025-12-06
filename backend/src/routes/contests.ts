import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query } from "../services/db.js";
import { getOrSet, deleteCache } from "../services/cache.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const contestsRouter = Router();

// ============================================
// Validation Schemas
// ============================================
const questionSchema = z.object({
    id: z.string().uuid().optional(),
    question: z.string().min(1),
    type: z.enum(["multiple-choice", "true-false", "short-answer"]),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    explanation: z.string().optional(),
    points: z.number().int().min(1).default(10),
});

const createContestSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    questions: z.array(questionSchema).default([]),
    passing_score: z.number().int().min(0).max(100).default(70),
    time_limit: z.number().int().min(1).default(60),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    max_participants: z.number().int().positive().optional(),
    is_public: z.boolean().default(true),
    status: z.enum(["draft", "upcoming", "active", "ended"]).default("draft"),
});

const updateContestSchema = createContestSchema.partial();

const submitAnswersSchema = z.object({
    answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

// ============================================
// Get All Contests (Public)
// ============================================
contestsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const cacheKey = `contests:list:${status || "all"}:${page}:${limit}`;

        const contests = await getOrSet(cacheKey, async () => {
            let queryText = `
                SELECT 
                    c.id, c.title, c.description, c.time_limit, 
                    c.start_time, c.end_time, c.max_participants, 
                    c.is_public, c.status, c.created_at,
                    u.name as creator_name,
                    (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count,
                    jsonb_array_length(c.questions) as question_count
                FROM contests c
                JOIN users u ON c.created_by = u.id
                WHERE c.is_public = true
            `;

            const params: unknown[] = [];
            let paramIndex = 1;

            if (status) {
                queryText += ` AND c.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            queryText += ` ORDER BY c.start_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);
            return result.rows;
        }, 60);

        // Get total count
        const countResult = await query(
            "SELECT COUNT(*) as total FROM contests WHERE is_public = true",
            []
        );

        res.json({
            contests,
            total: parseInt((countResult.rows[0] as { total: string }).total),
            page: parseInt(page as string),
            limit: parseInt(limit as string),
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Contest by ID
// ============================================
contestsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const contest = await getOrSet(`contest:${id}`, async () => {
            const result = await query(
                `SELECT 
                    c.*,
                    u.name as creator_name,
                    (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
                FROM contests c
                JOIN users u ON c.created_by = u.id
                WHERE c.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        }, 60);

        if (!contest) {
            res.status(404).json({ error: "Contest not found" });
            return;
        }

        res.json({ contest });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Contest Leaderboard
// ============================================
contestsRouter.get("/:id/leaderboard", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { limit = "50" } = req.query;

        const leaderboard = await query(
            `SELECT 
                cp.user_id, cp.score, cp.submitted_at,
                u.name, u.avatar,
                RANK() OVER (ORDER BY cp.score DESC, cp.submitted_at ASC) as rank
            FROM contest_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.contest_id = $1 AND cp.submitted_at IS NOT NULL
            ORDER BY cp.score DESC, cp.submitted_at ASC
            LIMIT $2`,
            [id, parseInt(limit as string)]
        );

        res.json({ leaderboard: leaderboard.rows });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create Contest (Admin only)
// ============================================
contestsRouter.post(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = createContestSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Add UUIDs to questions if not present
            const questionsWithIds = data.questions.map((q) => ({
                ...q,
                id: q.id || crypto.randomUUID(),
            }));

            const result = await query(
                `INSERT INTO contests (
                    title, description, questions, passing_score, time_limit,
                    start_time, end_time, max_participants, is_public, status, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *`,
                [
                    data.title,
                    data.description,
                    JSON.stringify(questionsWithIds),
                    data.passing_score,
                    data.time_limit,
                    data.start_time,
                    data.end_time,
                    data.max_participants,
                    data.is_public,
                    data.status,
                    userId,
                ]
            );

            await deleteCache("contests:list:*");

            res.status(201).json({ contest: result.rows[0] });
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
// Update Contest (Admin only)
// ============================================
contestsRouter.put(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = updateContestSchema.parse(req.body);

            // Check if contest exists
            const existing = await query("SELECT id FROM contests WHERE id = $1", [id]);
            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Contest not found" });
                return;
            }

            // Build update query
            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    if (key === "questions") {
                        updates.push(`${key} = $${paramIndex}`);
                        values.push(JSON.stringify(value));
                    } else {
                        updates.push(`${key} = $${paramIndex}`);
                        values.push(value);
                    }
                    paramIndex++;
                }
            }

            if (updates.length === 0) {
                res.status(400).json({ error: "No updates provided" });
                return;
            }

            values.push(id);

            const result = await query(
                `UPDATE contests SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
                values
            );

            await deleteCache(`contest:${id}`);
            await deleteCache("contests:list:*");

            res.json({ contest: result.rows[0] });
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
// Delete Contest (Admin only)
// ============================================
contestsRouter.delete(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const result = await query("DELETE FROM contests WHERE id = $1 RETURNING id", [id]);

            if (result.rows.length === 0) {
                res.status(404).json({ error: "Contest not found" });
                return;
            }

            await deleteCache(`contest:${id}`);
            await deleteCache("contests:list:*");

            res.json({ message: "Contest deleted" });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Register for Contest
// ============================================
contestsRouter.post(
    "/:id/register",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;

            // Check if contest exists and is open
            const contest = await query(
                "SELECT id, status, max_participants FROM contests WHERE id = $1",
                [id]
            );

            if (contest.rows.length === 0) {
                res.status(404).json({ error: "Contest not found" });
                return;
            }

            const contestData = contest.rows[0] as { status: string; max_participants: number | null };

            if (contestData.status === "ended") {
                res.status(400).json({ error: "Contest has ended" });
                return;
            }

            // Check max participants
            if (contestData.max_participants) {
                const count = await query(
                    "SELECT COUNT(*) as count FROM contest_participants WHERE contest_id = $1",
                    [id]
                );
                if (parseInt((count.rows[0] as { count: string }).count) >= contestData.max_participants) {
                    res.status(400).json({ error: "Contest is full" });
                    return;
                }
            }

            // Check if already registered
            const existing = await query(
                "SELECT id FROM contest_participants WHERE contest_id = $1 AND user_id = $2",
                [id, userId]
            );

            if (existing.rows.length > 0) {
                res.status(400).json({ error: "Already registered" });
                return;
            }

            await query(
                "INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2)",
                [id, userId]
            );

            res.status(201).json({ message: "Registered successfully" });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Start Contest (Record start time)
// ============================================
contestsRouter.post(
    "/:id/start",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;

            // Check registration
            const participant = await query(
                "SELECT id, started_at FROM contest_participants WHERE contest_id = $1 AND user_id = $2",
                [id, userId]
            );

            if (participant.rows.length === 0) {
                res.status(400).json({ error: "Not registered for this contest" });
                return;
            }

            const participantData = participant.rows[0] as { id: string; started_at: string | null };

            if (participantData.started_at) {
                res.status(400).json({ error: "Already started" });
                return;
            }

            // Get contest questions (without correct answers for security)
            const contest = await query(
                "SELECT questions, time_limit, status FROM contests WHERE id = $1",
                [id]
            );

            const contestData = contest.rows[0] as { questions: unknown[]; time_limit: number; status: string };

            if (contestData.status !== "active") {
                res.status(400).json({ error: "Contest is not active" });
                return;
            }

            // Update start time
            await query(
                "UPDATE contest_participants SET started_at = NOW() WHERE id = $1",
                [participantData.id]
            );

            // Remove correct answers from questions
            const questionsForParticipant = (contestData.questions as Array<{ correctAnswer?: unknown }>).map(
                ({ correctAnswer, ...q }) => q
            );

            res.json({
                message: "Contest started",
                questions: questionsForParticipant,
                time_limit: contestData.time_limit,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Submit Contest Answers
// ============================================
contestsRouter.post(
    "/:id/submit",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const userId = (req as Request & { userId: string }).userId;
            const { answers } = submitAnswersSchema.parse(req.body);

            // Get participant
            const participant = await query(
                "SELECT id, started_at, submitted_at FROM contest_participants WHERE contest_id = $1 AND user_id = $2",
                [id, userId]
            );

            if (participant.rows.length === 0) {
                res.status(400).json({ error: "Not registered for this contest" });
                return;
            }

            const participantData = participant.rows[0] as { id: string; started_at: string; submitted_at: string | null };

            if (!participantData.started_at) {
                res.status(400).json({ error: "Contest not started" });
                return;
            }

            if (participantData.submitted_at) {
                res.status(400).json({ error: "Already submitted" });
                return;
            }

            // Get contest questions with correct answers
            const contest = await query(
                "SELECT questions FROM contests WHERE id = $1",
                [id]
            );

            const questions = (contest.rows[0] as { questions: Array<{ id: string; correctAnswer: string | string[]; points: number }> }).questions;

            // Calculate score
            let score = 0;
            for (const q of questions) {
                const userAnswer = answers[q.id];
                if (userAnswer !== undefined) {
                    const correct = Array.isArray(q.correctAnswer)
                        ? q.correctAnswer
                        : [q.correctAnswer];
                    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

                    if (
                        correct.length === userAnswers.length &&
                        correct.every((a) => userAnswers.includes(a))
                    ) {
                        score += q.points;
                    }
                }
            }

            // Update participant
            await query(
                `UPDATE contest_participants 
                SET answers = $1, score = $2, submitted_at = NOW() 
                WHERE id = $3`,
                [JSON.stringify(answers), score, participantData.id]
            );

            // Get rank
            const rankResult = await query(
                `SELECT COUNT(*) + 1 as rank 
                FROM contest_participants 
                WHERE contest_id = $1 AND submitted_at IS NOT NULL AND score > $2`,
                [id, score]
            );

            const rank = parseInt((rankResult.rows[0] as { rank: string }).rank);

            // Get user name for broadcast
            const userData = await query("SELECT name FROM users WHERE id = $1", [userId]);
            const userName = (userData.rows[0] as { name: string }).name;

            // Note: Socket broadcast will be handled by the caller
            // The response includes data needed for broadcasting
            res.json({
                message: "Submitted successfully",
                score,
                rank,
                contestId: id,
                userId,
                userName,
            });
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
// Admin: Get All Contests (including private)
// ============================================
contestsRouter.get(
    "/admin/all",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, page = "1", limit = "20", search } = req.query;
            const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

            let queryText = `
                SELECT 
                    c.*,
                    u.name as creator_name,
                    (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count,
                    jsonb_array_length(c.questions) as question_count
                FROM contests c
                JOIN users u ON c.created_by = u.id
                WHERE 1=1
            `;

            const params: unknown[] = [];
            let paramIndex = 1;

            if (status) {
                queryText += ` AND c.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (search) {
                queryText += ` AND c.title ILIKE $${paramIndex}`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            queryText += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);

            // Get total count
            let countQuery = "SELECT COUNT(*) as total FROM contests WHERE 1=1";
            const countParams: unknown[] = [];
            let countParamIndex = 1;

            if (status) {
                countQuery += ` AND status = $${countParamIndex}`;
                countParams.push(status);
                countParamIndex++;
            }

            if (search) {
                countQuery += ` AND title ILIKE $${countParamIndex}`;
                countParams.push(`%${search}%`);
            }

            const countResult = await query(countQuery, countParams);

            res.json({
                contests: result.rows,
                total: parseInt((countResult.rows[0] as { total: string }).total),
                page: parseInt(page as string),
                limit: parseInt(limit as string),
            });
        } catch (error) {
            next(error);
        }
    }
);
