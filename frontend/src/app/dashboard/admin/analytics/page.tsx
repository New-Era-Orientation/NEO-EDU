"use client";

import { useState, useEffect } from "react";
import {
    Loader2,
    Users,
    BookOpen,
    GraduationCap,
    ClipboardList,
    TrendingUp,
    Activity,
    Award,
    UserPlus,
    BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { api } from "@/lib/api";

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

interface TopCourse {
    id: string;
    title: string;
    enrolled_count: number;
    average_rating: number;
}

interface ExamPerformance {
    id: string;
    title: string;
    attempts: number;
    avg_score: string;
    pass_rate: string;
}

interface ActivityItem {
    type: string;
    user_name: string;
    target: string;
    created_at: string;
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
    const [examPerformance, setExamPerformance] = useState<ExamPerformance[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setIsLoading(true);
                const [dashboardRes, coursesRes, examsRes, activityRes] = await Promise.all([
                    api.getAnalyticsDashboard(),
                    api.getAnalyticsTopCourses(),
                    api.getAnalyticsExamPerformance(),
                    api.getAnalyticsActivity(),
                ]);

                setStats(dashboardRes.stats);
                setTopCourses(coursesRes.courses);
                setExamPerformance(examsRes.exams);
                setActivities(activityRes.activities);
            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, []);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Failed to load analytics data
            </div>
        );
    }

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
        { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "text-green-500" },
        { label: "Total Lessons", value: stats.totalLessons, icon: GraduationCap, color: "text-purple-500" },
        { label: "Total Exams", value: stats.totalExams, icon: ClipboardList, color: "text-orange-500" },
        { label: "Enrollments", value: stats.totalEnrollments, icon: TrendingUp, color: "text-pink-500" },
        { label: "Active (7d)", value: stats.activeUsers7d, icon: Activity, color: "text-cyan-500" },
        { label: "New Users (7d)", value: stats.newUsers7d, icon: UserPlus, color: "text-emerald-500" },
        { label: "Exams Done (7d)", value: stats.examCompletions7d, icon: Award, color: "text-amber-500" },
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "enrollment": return <BookOpen className="w-4 h-4 text-green-500" />;
            case "exam_submit": return <ClipboardList className="w-4 h-4 text-blue-500" />;
            case "user_register": return <UserPlus className="w-4 h-4 text-purple-500" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityText = (item: ActivityItem) => {
        switch (item.type) {
            case "enrollment": return `enrolled in "${item.target}"`;
            case "exam_submit": return `completed exam "${item.target}"`;
            case "user_register": return "registered";
            default: return item.type;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-8 h-8" />
                    Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Platform statistics and insights</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Courses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Top Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topCourses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No course data</p>
                        ) : (
                            <div className="space-y-3">
                                {topCourses.slice(0, 5).map((course, i) => (
                                    <div key={course.id} className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{course.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {course.enrolled_count} enrolled • ⭐ {course.average_rating?.toFixed(1) || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Exam Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5" />
                            Exam Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {examPerformance.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No exam data</p>
                        ) : (
                            <div className="space-y-3">
                                {examPerformance.slice(0, 5).map((exam) => (
                                    <div key={exam.id} className="flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{exam.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {exam.attempts} attempts • Avg: {exam.avg_score}%
                                            </div>
                                        </div>
                                        <Badge variant={parseFloat(exam.pass_rate) >= 70 ? "default" : "secondary"}>
                                            {exam.pass_rate}% pass
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    {getActivityIcon(activity.type)}
                                    <span className="font-medium">{activity.user_name}</span>
                                    <span className="text-muted-foreground">{getActivityText(activity)}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {new Date(activity.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
