"use client";

import { use } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Clock,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, CardContent, Progress, LoadingPage, Badge } from "@/components/ui";
import { useCourse, useLesson, useMarkLessonComplete } from "@/lib/hooks";
import { useCourseProgressStore } from "@/stores";
import { formatDuration, cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string; lessonId: string }>;
}

export default function LessonPage({ params }: PageProps) {
    const { id: courseId, lessonId } = use(params);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { data: courseData, isLoading: courseLoading } = useCourse(courseId);
    const { data: lessonData, isLoading: lessonLoading } = useLesson(lessonId);
    const markComplete = useMarkLessonComplete();
    const { getLessonProgress, setLessonProgress, getCourseProgress } = useCourseProgressStore();

    const isLoading = courseLoading || lessonLoading;

    if (isLoading) {
        return <LoadingPage />;
    }

    const course = courseData?.course;
    const lesson = lessonData?.lesson;
    const lessons = course?.lessons || [];

    if (!course || !lesson) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">Lesson not found</h2>
                <p className="text-muted-foreground mb-6">
                    The lesson you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link href={`/dashboard/courses/${courseId}`}>
                    <Button>Back to Course</Button>
                </Link>
            </div>
        );
    }

    const currentIndex = lessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    const lessonProgress = getLessonProgress(courseId, lessonId);
    const courseProgress = getCourseProgress(courseId);

    const handleMarkComplete = async () => {
        try {
            await markComplete.mutateAsync({ id: lessonId, progress: 100 });
            setLessonProgress(courseId, {
                lessonId,
                completed: true,
                progress: 100,
                lastAccessedAt: new Date(),
            });
        } catch (err) {
            console.error("Failed to mark as complete:", err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] -m-4 lg:-m-6">
            {/* Sidebar - Lesson List */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transform transition-transform lg:transform-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between mb-4">
                            <Link
                                href={`/dashboard/courses/${courseId}`}
                                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to Course
                            </Link>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1 rounded hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="font-semibold line-clamp-2">{course.title}</h2>
                        <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{courseProgress}%</span>
                            </div>
                            <Progress value={courseProgress} />
                        </div>
                    </div>

                    {/* Lesson List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {lessons.map((l, index) => {
                            const isActive = l.id === lessonId;
                            const progress = getLessonProgress(courseId, l.id);
                            const isCompleted = progress?.completed;

                            return (
                                <Link
                                    key={l.id}
                                    href={`/dashboard/courses/${courseId}/lessons/${l.id}`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs",
                                            isCompleted
                                                ? "bg-green-500 text-white"
                                                : isActive
                                                    ? "gradient-primary text-white"
                                                    : "bg-muted"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-2">{l.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDuration(l.duration)}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Bar */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-muted"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{lesson.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                                Lesson {currentIndex + 1} of {lessons.length}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant={lessonProgress?.completed ? "outline" : "default"}
                            onClick={handleMarkComplete}
                            disabled={lessonProgress?.completed}
                        >
                            {lessonProgress?.completed ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Completed
                                </>
                            ) : (
                                "Mark Complete"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Lesson Content */}
                <div className="max-w-4xl mx-auto p-4 lg:p-8">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-4">{lesson.title}</h1>

                    {lesson.description && (
                        <p className="text-muted-foreground mb-6">{lesson.description}</p>
                    )}

                    {/* Video Player (if video type) */}
                    {lesson.type === "video" && lesson.video_url && (
                        <div className="aspect-video bg-muted rounded-xl mb-8 overflow-hidden">
                            <video
                                src={lesson.video_url}
                                controls
                                className="w-full h-full"
                            />
                        </div>
                    )}

                    {/* Lesson Content */}
                    {lesson.content && (
                        <Card>
                            <CardContent className="p-6 lg:p-8 prose prose-slate dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
                        {prevLesson ? (
                            <Link href={`/dashboard/courses/${courseId}/lessons/${prevLesson.id}`}>
                                <Button variant="outline">
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
                        ) : (
                            <div />
                        )}

                        {nextLesson ? (
                            <Link href={`/dashboard/courses/${courseId}/lessons/${nextLesson.id}`}>
                                <Button>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/dashboard/courses/${courseId}`}>
                                <Button>
                                    Finish Course
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
