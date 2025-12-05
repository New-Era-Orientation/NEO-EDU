import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Star } from "lucide-react";
import { Card, Badge, Progress } from "@/components/ui";
import { formatDuration, truncate } from "@/lib/utils";
import type { Course } from "@/lib/api";

interface CourseCardProps {
    course: Course;
    progress?: number;
    showProgress?: boolean;
}

export function CourseCard({ course, progress, showProgress = false }: CourseCardProps) {
    return (
        <Link href={`/dashboard/courses/${course.id}`}>
            <Card hover className="overflow-hidden h-full">
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
                    <div className="absolute top-3 left-3">
                        <Badge>{course.category}</Badge>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {truncate(course.description, 100)}
                    </p>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-medium">
                            {course.instructor_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {course.instructor_name}
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course.enrolled_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{course.rating?.toFixed(1) || "N/A"}</span>
                        </div>
                    </div>

                    {/* Progress */}
                    {showProgress && progress !== undefined && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    );
}
