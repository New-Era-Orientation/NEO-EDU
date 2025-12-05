"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Star, BookOpen, ArrowLeft, Play, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCourse } from "@/lib/hooks";
import { useAuthStore } from "@/stores";
import { formatDuration } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PublicCourseDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { t } = useI18n();
    const { data, isLoading, error } = useCourse(id);
    const { isAuthenticated } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data?.course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold mb-2">Không tìm thấy khóa học</h2>
                <Link href="/courses" className="text-primary hover:underline">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const course = data.course;
    const lessons = course.lessons || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/assets/logo.png"
                                alt="NEO EDU Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                                priority
                            />
                            <span className="text-xl font-bold gradient-text">NEO EDU</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                                >
                                    {t("dashboard.title")}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {t("auth.signIn")}
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        {t("auth.createAccount")}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-24 pb-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back */}
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Link>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Header */}
                            <div>
                                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                                    {course.category}
                                </div>
                                <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                                <p className="text-lg text-muted-foreground">{course.description}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <span>{formatDuration(course.duration)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                    <span>{course.lesson_count || lessons.length} {t("courses.lessons")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    <span>{course.enrolled_count.toLocaleString()} {t("courses.students")}</span>
                                </div>
                                {course.rating && (
                                    <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500" />
                                        <span>{course.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Instructor */}
                            <div className="bg-card rounded-xl border border-border p-6">
                                <h3 className="font-semibold mb-4">{t("courses.instructor")}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                                        {course.instructor_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{course.instructor_name}</h4>
                                        {course.instructor_bio && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {course.instructor_bio}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Lesson List */}
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <div className="p-6 border-b border-border">
                                    <h3 className="font-semibold">{t("courses.courseContent")}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {lessons.length} {t("courses.lessons")}
                                    </p>
                                </div>

                                {lessons.length > 0 ? (
                                    <ul className="divide-y divide-border">
                                        {lessons.map((lesson, index) => (
                                            <li key={lesson.id} className="flex items-center gap-4 p-4">
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{lesson.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDuration(lesson.duration)}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-muted text-xs">
                                                            {lesson.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!isAuthenticated && (
                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {t("courses.noLessons")}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 bg-card rounded-xl border border-border overflow-hidden">
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-muted">
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 gradient-primary opacity-20" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white ml-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold gradient-text">{t("courses.free")}</p>
                                        <p className="text-sm text-muted-foreground">{t("courses.fullAccess")}</p>
                                    </div>

                                    {isAuthenticated ? (
                                        <Link
                                            href={`/dashboard/courses/${course.id}`}
                                            className="block w-full py-3 text-center gradient-primary text-white font-semibold rounded-lg"
                                        >
                                            {t("courses.enroll")}
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/signup?redirect=/courses/${course.id}`}
                                            className="block w-full py-3 text-center gradient-primary text-white font-semibold rounded-lg"
                                        >
                                            Đăng ký để học
                                        </Link>
                                    )}

                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-2 text-muted-foreground">
                                            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs">✓</span>
                                            {t("courses.fullAccess")}
                                        </li>
                                        <li className="flex items-center gap-2 text-muted-foreground">
                                            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs">✓</span>
                                            {t("courses.offlineAvailable")}
                                        </li>
                                        <li className="flex items-center gap-2 text-muted-foreground">
                                            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs">✓</span>
                                            {t("courses.certificate")}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
