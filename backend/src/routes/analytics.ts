import { Router, type Request, type Response, type NextFunction } from "express";
import { query } from "../services/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { getOrSet } from "../services/cache.js";

export const analyticsRouter = Router();

// ============================================
// Types
// ============================================
interface DashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalLessons: number;
    totalExams: number;
    totalEnrollments: number;
    activeUsers7d: number;
    newUsers7d: number;
    examCompletions7d: number;
}

interface ChartDataPoint {
    date: string;
    count: number;
}

// ============================================
// Dashboard Overview Stats (Admin)
// ============================================
analyticsRouter.get(
    "/dashboard",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await getOrSet<DashboardStats>(
                "analytics:dashboard",
                async () => {
                    // Total counts
                    const [users, courses, lessons, exams, enrollments] = await Promise.all([
                        query("SELECT COUNT(*) as count FROM users"),
                        query("SELECT COUNT(*) as count FROM courses"),
                        query("SELECT COUNT(*) as count FROM lessons"),
                        query("SELECT COUNT(*) as count FROM exams"),
                        query("SELECT COUNT(*) as count FROM enrollments"),
                    ]);

                    // Active users in last 7 days (by quiz attempts or exam submissions)
                    const activeUsers = await query(`
                        SELECT COUNT(DISTINCT user_id) as count
                        FROM (
                            SELECT user_id FROM quiz_attempts WHERE created_at > NOW() - INTERVAL '7 days'
                            UNION
                            SELECT user_id FROM exam_submissions WHERE submitted_at > NOW() - INTERVAL '7 days'
                            UNION
                            SELECT user_id FROM enrollments WHERE enrolled_at > NOW() - INTERVAL '7 days'
                        ) active
                    `);

                    // New users in last 7 days
                    const newUsers = await query(`
                        SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'
                    `);

                    // Exam completions in last 7 days
                    const examCompletions = await query(`
                        SELECT COUNT(*) as count FROM exam_submissions 
                        WHERE submitted_at > NOW() - INTERVAL '7 days'
                    `);

                    return {
                        totalUsers: parseInt(users.rows[0].count),
                        totalCourses: parseInt(courses.rows[0].count),
                        totalLessons: parseInt(lessons.rows[0].count),
                        totalExams: parseInt(exams.rows[0].count),
                        totalEnrollments: parseInt(enrollments.rows[0].count),
                        activeUsers7d: parseInt(activeUsers.rows[0].count),
                        newUsers7d: parseInt(newUsers.rows[0].count),
                        examCompletions7d: parseInt(examCompletions.rows[0].count),
                    };
                },
                300 // 5 min cache
            );

            res.json({ stats });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// User Registration Trend (Last 30 days)
// ============================================
analyticsRouter.get(
    "/users/trend",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await getOrSet<ChartDataPoint[]>(
                "analytics:users:trend",
                async () => {
                    const result = await query(`
                        SELECT DATE(created_at) as date, COUNT(*) as count
                        FROM users
                        WHERE created_at > NOW() - INTERVAL '30 days'
                        GROUP BY DATE(created_at)
                        ORDER BY date
                    `);
                    return (result.rows as Array<{ date: string; count: string }>).map((row) => ({
                        date: row.date,
                        count: parseInt(row.count),
                    }));
                },
                600
            );

            res.json({ data });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Course Enrollments Trend (Last 30 days)
// ============================================
analyticsRouter.get(
    "/enrollments/trend",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await getOrSet<ChartDataPoint[]>(
                "analytics:enrollments:trend",
                async () => {
                    const result = await query(`
                        SELECT DATE(enrolled_at) as date, COUNT(*) as count
                        FROM enrollments
                        WHERE enrolled_at > NOW() - INTERVAL '30 days'
                        GROUP BY DATE(enrolled_at)
                        ORDER BY date
                    `);
                    return (result.rows as Array<{ date: string; count: string }>).map((row) => ({
                        date: row.date,
                        count: parseInt(row.count),
                    }));
                },
                600
            );

            res.json({ data });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Top Courses by Enrollment
// ============================================
analyticsRouter.get(
    "/courses/top",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await getOrSet(
                "analytics:courses:top",
                async () => {
                    const result = await query(`
                        SELECT c.id, c.title, c.enrolled_count, c.rating
                        FROM courses c
                        ORDER BY c.enrolled_count DESC
                        LIMIT 10
                    `);
                    return result.rows;
                },
                600
            );

            res.json({ courses: data });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Exam Performance Overview
// ============================================
analyticsRouter.get(
    "/exams/performance",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await getOrSet(
                "analytics:exams:performance",
                async () => {
                    const result = await query(`
                        SELECT 
                            e.id,
                            e.title,
                            COUNT(es.id) as attempts,
                            COALESCE(AVG(es.score), 0) as avg_score,
                            COUNT(CASE WHEN es.passed THEN 1 END) as passed,
                            COUNT(CASE WHEN NOT es.passed THEN 1 END) as failed
                        FROM exams e
                        LEFT JOIN exam_submissions es ON e.id = es.exam_id
                        WHERE es.submitted_at IS NOT NULL
                        GROUP BY e.id, e.title
                        ORDER BY attempts DESC
                        LIMIT 10
                    `);
                    return result.rows.map((row: Record<string, unknown>) => ({
                        ...row,
                        avg_score: parseFloat(String(row.avg_score)).toFixed(1),
                        pass_rate: row.attempts ?
                            ((parseInt(String(row.passed)) / parseInt(String(row.attempts))) * 100).toFixed(1) : 0,
                    }));
                },
                600
            );

            res.json({ exams: data });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Recent Activity Feed
// ============================================
analyticsRouter.get(
    "/activity",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const activities = await query(`
                (
                    SELECT 'enrollment' as type, u.name as user_name, c.title as target, e.enrolled_at as created_at
                    FROM enrollments e
                    JOIN users u ON e.user_id = u.id
                    JOIN courses c ON e.course_id = c.id
                    ORDER BY e.enrolled_at DESC
                    LIMIT 5
                )
                UNION ALL
                (
                    SELECT 'exam_submit' as type, u.name as user_name, ex.title as target, es.submitted_at as created_at
                    FROM exam_submissions es
                    JOIN users u ON es.user_id = u.id
                    JOIN exams ex ON es.exam_id = ex.id
                    WHERE es.submitted_at IS NOT NULL
                    ORDER BY es.submitted_at DESC
                    LIMIT 5
                )
                UNION ALL
                (
                    SELECT 'user_register' as type, name as user_name, '' as target, created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT 5
                )
                ORDER BY created_at DESC
                LIMIT 15
            `);

            res.json({ activities: activities.rows });
        } catch (error) {
            next(error);
        }
    }
);
