"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Clock,
    Users,
    Star,
    Play,
    BookOpen,
    CheckCircle,
    Lock,
    ArrowLeft,
} from "lucide-react";
import {
    Card,
    CardContent,
    Button,
    Badge,
    Progress,
    Avatar,
    LoadingPage,
} from "@/components/ui";
import { useCourse, useEnrollCourse } from "@/lib/hooks";
import { useAuthStore } from "@/stores";
import { formatDuration } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { data, isLoading, error } = useCourse(id);
    const enrollMutation = useEnrollCourse();
    const { user } = useAuthStore();

    if (isLoading) {
        return <LoadingPage />;
    }

    if (error || !data?.course) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">Course not found</h2>
                <p className="text-muted-foreground mb-6">
                    The course you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Link href="/dashboard/courses">
                    <Button>Back to Courses</Button>
                </Link>
            </div>
        );
    }

    const course = data.course;
    const lessons = course.lessons || [];

    const handleEnroll = async () => {
        try {
            await enrollMutation.mutateAsync(id);
        } catch (err) {
            console.error("Failed to enroll:", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Back Link */}
            <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
            </Link>

            {/* Header Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Course Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <Badge className="mb-4">{course.category}</Badge>
                        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                        <p className="text-lg text-muted-foreground">{course.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span>{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                            <span>{course.lesson_count || lessons.length} lessons</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span>{course.enrolled_count.toLocaleString()} enrolled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span>{course.rating?.toFixed(1) || "N/A"}</span>
                        </div>
                    </div>

                    {/* Instructor */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4">Instructor</h3>
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src={course.instructor_avatar}
                                    fallback={course.instructor_name}
                                    size="lg"
                                />
                                <div>
                                    <h4 className="font-medium">{course.instructor_name}</h4>
                                    {course.instructor_bio && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {course.instructor_bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {course.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Enrollment Card */}
                <div>
                    <Card className="sticky top-24">
                        {/* Course Thumbnail */}
                        <div className="relative aspect-video bg-muted rounded-t-2xl overflow-hidden">
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
                                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                    <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold gradient-text">Free</p>
                                <p className="text-sm text-muted-foreground">
                                    Full lifetime access
                                </p>
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleEnroll}
                                isLoading={enrollMutation.isPending}
                            >
                                Enroll Now
                            </Button>

                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Full lifetime access
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Available offline
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Certificate of completion
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Course Content */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                <Card>
                    <CardContent className="p-0">
                        {lessons.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {lessons.map((lesson, index) => (
                                    <li key={lesson.id}>
                                        <Link
                                            href={`/dashboard/courses/${id}/lessons/${lesson.id}`}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-medium">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{lesson.title}</h4>
                                                {lesson.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {lesson.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDuration(lesson.duration)}
                                                </span>
                                                <Badge variant="secondary">{lesson.type}</Badge>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                No lessons available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
