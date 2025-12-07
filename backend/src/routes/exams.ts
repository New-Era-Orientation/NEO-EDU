import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query } from "../services/db.js";
import { getOrSet, deleteCache } from "../services/cache.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const examsRouter = Router();

// ============================================
// Validation Schemas
// ============================================
const questionSchema = z.object({
    question_text: z.string().min(1),
    question_type: z.enum(["multiple-choice", "true-false", "short-answer"]),
    options: z.array(z.string()).optional(),
    correct_answer: z.string().min(1),
    points: z.number().int().min(1).default(1),
    order: z.number().int().min(0).default(0),
    explanation: z.string().optional(),
});

const createExamSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    course_id: z.string().uuid().optional().nullable(),
    duration_minutes: z.number().int().min(1).default(60),
    passing_score: z.number().int().min(0).max(100).default(70),
    max_attempts: z.number().int().min(1).default(1),
    shuffle_questions: z.boolean().default(false),
    is_published: z.boolean().default(false),
    questions: z.array(questionSchema).optional(),
});

const updateExamSchema = createExamSchema.partial();

// ============================================
// Get All Published Exams (Public)
// ============================================
examsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { course_id, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const cacheKey = `exams:public:${course_id || "all"}:${page}:${limit}`;

        const exams = await getOrSet(cacheKey, async () => {
            let queryText = `
                SELECT e.id, e.title, e.description, e.duration_minutes, e.passing_score,
                       e.course_id, e.created_at,
                       u.name as creator_name,
                       c.title as course_title,
                       (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
                FROM exams e
                LEFT JOIN users u ON e.created_by = u.id
                LEFT JOIN courses c ON e.course_id = c.id
                WHERE e.is_published = true
            `;

            const params: unknown[] = [];
            let paramIndex = 1;

            if (course_id) {
                queryText += ` AND e.course_id = $${paramIndex}`;
                params.push(course_id);
                paramIndex++;
            }

            queryText += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit as string), offset);

            const result = await query(queryText, params);
            return result.rows;
        }, 60);

        res.json({ exams });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get All Exams (Admin)
// ============================================
examsRouter.get("/admin", authenticate, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, page = "1", limit = "20" } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let queryText = `
            SELECT e.id, e.title, e.description, e.duration_minutes, e.passing_score,
                   e.is_published, e.created_at, e.updated_at,
                   u.name as creator_name,
                   c.title as course_title,
                   (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count,
                   (SELECT COUNT(*) FROM exam_submissions WHERE exam_id = e.id) as submission_count
            FROM exams e
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE 1=1
        `;

        const params: unknown[] = [];
        let paramIndex = 1;

        if (search) {
            queryText += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), offset);

        const result = await query(queryText, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM exams WHERE 1=1`;
        const countParams: unknown[] = [];
        if (search) {
            countQuery += ` AND (title ILIKE $1 OR description ILIKE $1)`;
            countParams.push(`%${search}%`);
        }
        const countResult = await query(countQuery, countParams);

        res.json({
            exams: result.rows,
            total: parseInt((countResult.rows[0] as { total: string }).total),
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Single Exam (Public - for details page)
// ============================================
examsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const exam = await getOrSet(`exam:${id}`, async () => {
            const result = await query(
                `SELECT e.*, u.name as creator_name, c.title as course_title,
                        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
                 FROM exams e
                 LEFT JOIN users u ON e.created_by = u.id
                 LEFT JOIN courses c ON e.course_id = c.id
                 WHERE e.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        }, 300);

        if (!exam) {
            res.status(404).json({ error: "Exam not found" });
            return;
        }

        res.json({ exam });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get Exam with Questions (Admin)
// ============================================
examsRouter.get("/admin/:id", authenticate, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const examResult = await query(
            `SELECT e.*, u.name as creator_name
             FROM exams e
             LEFT JOIN users u ON e.created_by = u.id
             WHERE e.id = $1`,
            [id]
        );

        if (examResult.rows.length === 0) {
            res.status(404).json({ error: "Exam not found" });
            return;
        }

        const questionsResult = await query(
            `SELECT * FROM exam_questions WHERE exam_id = $1 ORDER BY "order"`,
            [id]
        );

        res.json({
            exam: examResult.rows[0],
            questions: questionsResult.rows
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create Exam (Admin only)
// ============================================
examsRouter.post(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = createExamSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Create exam
            const examResult = await query(
                `INSERT INTO exams (title, description, course_id, duration_minutes, passing_score, max_attempts, shuffle_questions, is_published, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    data.title,
                    data.description || null,
                    data.course_id || null,
                    data.duration_minutes,
                    data.passing_score,
                    data.max_attempts,
                    data.shuffle_questions,
                    data.is_published,
                    userId
                ]
            );

            const exam = examResult.rows[0] as { id: string };

            // Insert questions if provided
            if (data.questions && data.questions.length > 0) {
                for (let i = 0; i < data.questions.length; i++) {
                    const q = data.questions[i];
                    await query(
                        `INSERT INTO exam_questions (exam_id, question_text, question_type, options, correct_answer, points, "order", explanation)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            exam.id,
                            q.question_text,
                            q.question_type,
                            q.options ? JSON.stringify(q.options) : null,
                            q.correct_answer,
                            q.points,
                            q.order || i,
                            q.explanation || null
                        ]
                    );
                }
            }

            await deleteCache("exams:public:*");

            res.status(201).json({ exam: examResult.rows[0] });
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
// Update Exam (Admin only)
// ============================================
examsRouter.put(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = updateExamSchema.parse(req.body);

            // Check if exam exists
            const existing = await query(`SELECT * FROM exams WHERE id = $1`, [id]);
            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Exam not found" });
                return;
            }

            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            const fields = ["title", "description", "course_id", "duration_minutes", "passing_score", "max_attempts", "shuffle_questions", "is_published"];
            for (const field of fields) {
                if ((data as Record<string, unknown>)[field] !== undefined) {
                    updates.push(`${field} = $${paramIndex}`);
                    values.push((data as Record<string, unknown>)[field]);
                    paramIndex++;
                }
            }

            if (updates.length > 0) {
                updates.push(`updated_at = NOW()`);
                values.push(id);

                await query(
                    `UPDATE exams SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
                    values
                );
            }

            // Update questions if provided
            if (data.questions) {
                // Delete existing questions
                await query(`DELETE FROM exam_questions WHERE exam_id = $1`, [id]);

                // Insert new questions
                for (let i = 0; i < data.questions.length; i++) {
                    const q = data.questions[i];
                    await query(
                        `INSERT INTO exam_questions (exam_id, question_text, question_type, options, correct_answer, points, "order", explanation)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            id,
                            q.question_text,
                            q.question_type,
                            q.options ? JSON.stringify(q.options) : null,
                            q.correct_answer,
                            q.points,
                            q.order || i,
                            q.explanation || null
                        ]
                    );
                }
            }

            await deleteCache(`exam:${id}`);
            await deleteCache("exams:public:*");

            const result = await query(`SELECT * FROM exams WHERE id = $1`, [id]);
            res.json({ exam: result.rows[0] });
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
// Delete Exam (Admin only)
// ============================================
examsRouter.delete(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const existing = await query(`SELECT id FROM exams WHERE id = $1`, [id]);
            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Exam not found" });
                return;
            }

            await query(`DELETE FROM exams WHERE id = $1`, [id]);

            await deleteCache(`exam:${id}`);
            await deleteCache("exams:public:*");

            res.json({ message: "Exam deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Get Questions for Taking Exam (Auth required)
// ============================================
examsRouter.get("/:id/questions", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Check if exam exists and is published
        const examResult = await query(
            `SELECT * FROM exams WHERE id = $1 AND is_published = true`,
            [id]
        );

        if (examResult.rows.length === 0) {
            res.status(404).json({ error: "Exam not found or not available" });
            return;
        }

        const exam = examResult.rows[0] as { shuffle_questions: boolean };

        // Get questions (without correct answers for students)
        let questionsQuery = `
            SELECT id, question_text, question_type, options, points, "order"
            FROM exam_questions
            WHERE exam_id = $1
        `;

        if (exam.shuffle_questions) {
            questionsQuery += ` ORDER BY RANDOM()`;
        } else {
            questionsQuery += ` ORDER BY "order"`;
        }

        const questionsResult = await query(questionsQuery, [id]);

        res.json({
            exam: examResult.rows[0],
            questions: questionsResult.rows
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Start Exam Attempt (Auth required)
// ============================================
examsRouter.post("/:id/start", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as Request & { userId: string }).userId;

        // Check if exam exists
        const examResult = await query(
            `SELECT * FROM exams WHERE id = $1 AND is_published = true`,
            [id]
        );

        if (examResult.rows.length === 0) {
            res.status(404).json({ error: "Exam not found or not available" });
            return;
        }

        const exam = examResult.rows[0] as { max_attempts: number };

        // Check if user already has a submission
        const existingSubmission = await query(
            `SELECT * FROM exam_submissions WHERE exam_id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (existingSubmission.rows.length > 0) {
            const submission = existingSubmission.rows[0] as { submitted_at: string | null };
            if (submission.submitted_at) {
                res.status(400).json({ error: "You have already completed this exam" });
                return;
            }
            // Return existing in-progress submission
            res.json({ message: "Exam already started", submission: existingSubmission.rows[0] });
            return;
        }

        // Create new submission
        const submissionResult = await query(
            `INSERT INTO exam_submissions (exam_id, user_id, started_at)
             VALUES ($1, $2, NOW())
             RETURNING *`,
            [id, userId]
        );

        res.json({ message: "Exam started", submission: submissionResult.rows[0] });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Submit Exam Answers (Auth required)
// ============================================
examsRouter.post("/:id/submit", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as Request & { userId: string }).userId;
        const { answers } = req.body as { answers: Record<string, string> };

        if (!answers || typeof answers !== "object") {
            res.status(400).json({ error: "Answers are required" });
            return;
        }

        // Get exam and questions
        const examResult = await query(`SELECT * FROM exams WHERE id = $1`, [id]);
        if (examResult.rows.length === 0) {
            res.status(404).json({ error: "Exam not found" });
            return;
        }

        const exam = examResult.rows[0] as { passing_score: number };

        const questionsResult = await query(
            `SELECT id, correct_answer, points, question_type FROM exam_questions WHERE exam_id = $1`,
            [id]
        );

        // Calculate score
        let earnedPoints = 0;
        let totalPoints = 0;

        for (const question of questionsResult.rows as Array<{ id: string; correct_answer: string; points: number; question_type: string }>) {
            totalPoints += question.points;
            const userAnswer = answers[question.id];

            if (userAnswer) {
                if (question.question_type === "true-false") {
                    // True/False: 4 sub-questions (a,b,c,d) with tiered scoring
                    // correct_answer format: "ĐSĐS" (Đ=Đúng, S=Sai) or "1010" (1=true, 0=false)
                    // userAnswer format: same
                    const correctParts = question.correct_answer.toUpperCase().split("");
                    const userParts = userAnswer.toUpperCase().split("");

                    let correctCount = 0;
                    for (let i = 0; i < Math.min(4, correctParts.length); i++) {
                        const correct = correctParts[i];
                        const user = userParts[i] || "";
                        // Normalize: Đ/D/1/T = true, S/0/F = false
                        const correctBool = ["Đ", "D", "1", "T"].includes(correct);
                        const userBool = ["Đ", "D", "1", "T"].includes(user);
                        if (correctBool === userBool) {
                            correctCount++;
                        }
                    }

                    // Tiered scoring: 1=0.1, 2=0.25, 3=0.5, 4=1.0 (of question points)
                    const tierMultiplier = [0, 0.1, 0.25, 0.5, 1.0];
                    earnedPoints += question.points * tierMultiplier[correctCount];

                } else if (question.question_type === "short-answer") {
                    // Short answer: only 4 chars allowed (numbers, comma, minus)
                    // Exact match required
                    const correctAnswer = question.correct_answer.trim();
                    const normalizedUserAnswer = userAnswer.trim();

                    // Validate format: only digits, comma, minus, space
                    const validFormat = /^[\d,\-\s]+$/.test(normalizedUserAnswer);

                    if (validFormat && normalizedUserAnswer === correctAnswer) {
                        earnedPoints += question.points;
                    }

                } else {
                    // For MCQ, exact match
                    const correctAnswer = question.correct_answer.toLowerCase().trim();
                    const normalizedUserAnswer = userAnswer.toLowerCase().trim();

                    if (normalizedUserAnswer === correctAnswer) {
                        earnedPoints += question.points;
                    }
                }
            }
        }

        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = scorePercent >= exam.passing_score;

        // Update submission
        const submissionResult = await query(
            `UPDATE exam_submissions
             SET answers = $1, score = $2, total_points = $3, passed = $4, submitted_at = NOW()
             WHERE exam_id = $5 AND user_id = $6
             RETURNING *`,
            [JSON.stringify(answers), scorePercent, totalPoints, passed, id, userId]
        );

        if (submissionResult.rows.length === 0) {
            // Create submission if not exists
            const newSubmission = await query(
                `INSERT INTO exam_submissions (exam_id, user_id, answers, score, total_points, passed, started_at, submitted_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 RETURNING *`,
                [id, userId, JSON.stringify(answers), scorePercent, totalPoints, passed]
            );
            res.json({
                message: "Exam submitted",
                submission: newSubmission.rows[0],
                score: scorePercent,
                passed,
                earnedPoints,
                totalPoints
            });
            return;
        }

        res.json({
            message: "Exam submitted",
            submission: submissionResult.rows[0],
            score: scorePercent,
            passed,
            earnedPoints,
            totalPoints
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// Get User's Exam Result (Auth required)
// ============================================
examsRouter.get("/:id/result", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as Request & { userId: string }).userId;

        const submissionResult = await query(
            `SELECT es.*, e.title as exam_title, e.passing_score
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             WHERE es.exam_id = $1 AND es.user_id = $2`,
            [id, userId]
        );

        if (submissionResult.rows.length === 0) {
            res.status(404).json({ error: "No submission found for this exam" });
            return;
        }

        res.json({ result: submissionResult.rows[0] });
    } catch (error) {
        next(error);
    }
});
