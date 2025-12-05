"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge
} from "@/components/ui";
import { api, type Course } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import Link from "next/link";
import Image from "next/image";

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // Action states
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch courses
    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const data = await api.getManagedCourses({
                page,
                limit: 10,
                search: debouncedSearch,
            });
            setCourses(data.courses);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [page, debouncedSearch]);

    const handleDelete = async (course: Course) => {
        if (!confirm(`Are you sure you want to delete course "${course.title}"?`)) return;

        try {
            setDeletingId(course.id);
            await api.deleteCourse(course.id);
            fetchCourses();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete course");
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePublish = async (course: Course) => {
        try {
            await api.updateCourse(course.id, { published: !course.published });
            // Optimistically update
            setCourses(courses.map(c => c.id === course.id ? { ...c, published: !c.published } : c));
        } catch (error) {
            alert("Failed to update status");
            fetchCourses(); // Revert on error
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Courses Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all courses, verify content and publish status
                    </p>
                </div>
                <Link href="/dashboard/create-course">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Create Course
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Courses Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Course</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Instructor</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Students</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Created</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No courses found.
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course) => (
                                        <tr key={course.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 relative">
                                                        {course.thumbnail ? (
                                                            <Image
                                                                src={course.thumbnail}
                                                                alt={course.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                                        )}
                                                    </div>
                                                    <div className="max-w-[200px]">
                                                        <div className="font-medium truncate" title={course.title}>{course.title}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{course.category}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{course.instructor_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={course.published ? "default" : "secondary"}>
                                                    {course.published ? "Published" : "Draft"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {course.enrolled_count || 0}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(course.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleTogglePublish(course)}
                                                        title={course.published ? "Unpublish" : "Publish"}
                                                    >
                                                        {course.published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" disabled={deletingId === course.id} onClick={() => handleDelete(course)}>
                                                        {deletingId === course.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
