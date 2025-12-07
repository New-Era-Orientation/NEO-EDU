"use client";

import { BookOpen } from "lucide-react";
import { Button, LoadingPage } from "@/components/ui";
import { CourseCard } from "@/components/dashboard";
import { useEnrolledCourses } from "@/lib/hooks";
import { useCourseProgressStore } from "@/stores";
import Link from "next/link";

export default function MyCoursesPage() {
    const { data, isLoading } = useEnrolledCourses();
    const { getCourseProgress } = useCourseProgressStore();

    if (isLoading) {
        return <LoadingPage />;
    }

    const courses = data?.courses || [];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold">My Courses</h1>
                <p className="text-muted-foreground mt-1">
                    Your enrolled courses and learning progress
                </p>
            </div>

            {/* Course Grid */}
            {courses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            progress={getCourseProgress(course.id)}
                            showProgress
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Start your learning journey by enrolling in a course.
                    </p>
                    <Link href="/dashboard/courses">
                        <Button>Browse Courses</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
