"use client";

import Link from "next/link";
import { BookOpen, Clock, Trophy, TrendingUp, ArrowRight, Play } from "lucide-react";
import { Card, CardContent, Progress, Button, LoadingPage } from "@/components/ui";
import { CourseCard } from "@/components/dashboard";
import { useAuthStore, useCourseProgressStore } from "@/stores";
import { useCourses, useEnrolledCourses } from "@/lib/hooks";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data: coursesData, isLoading: coursesLoading } = useCourses({ limit: 4 });
    const { data: enrolledData, isLoading: enrolledLoading } = useEnrolledCourses();

    const isLoading = coursesLoading || enrolledLoading;

    if (isLoading) {
        return <LoadingPage />;
    }

    const courses = coursesData?.courses || [];
    const enrolledCourses = enrolledData?.courses || [];

    // Stats
    const stats = [
        {
            label: "Enrolled Courses",
            value: enrolledCourses.length.toString(),
            icon: BookOpen,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            label: "Hours Learned",
            value: "12.5",
            icon: Clock,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            label: "Completed",
            value: "3",
            icon: Trophy,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
        },
        {
            label: "In Progress",
            value: (enrolledCourses.length - 3).toString(),
            icon: TrendingUp,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                        Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Continue learning and achieve your goals today.
                    </p>
                </div>
                <Link href="/dashboard/courses">
                    <Button>
                        Browse Courses
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4 lg:p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Continue Learning Section */}
            {enrolledCourses.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Continue Learning</h2>
                        <Link
                            href="/dashboard/my-courses"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Current Course Card */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/3 aspect-video md:aspect-auto bg-muted relative">
                                <div className="absolute inset-0 gradient-primary opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                        <Play className="w-8 h-8 text-white ml-1" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-muted-foreground">
                                        {enrolledCourses[0]?.category || "Course"}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {enrolledCourses[0]?.title || "Your Latest Course"}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Continue where you left off
                                </p>
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">35%</span>
                                    </div>
                                    <Progress value={35} />
                                </div>
                                <Link href={`/dashboard/courses/${enrolledCourses[0]?.id || ""}`}>
                                    <Button>
                                        Continue Learning
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </section>
            )}

            {/* Popular Courses Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Popular Courses</h2>
                    <Link
                        href="/dashboard/courses"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No courses available yet. Check back soon!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
