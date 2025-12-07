"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Eye,
    EyeOff,
    ClipboardList,
    Clock,
    Users
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    Badge
} from "@/components/ui";
import { api, type Exam } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import Link from "next/link";

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    const fetchExams = async () => {
        setIsLoading(true);
        try {
            const data = await api.getAdminExams({
                page,
                limit: 10,
                search: debouncedSearch,
            });
            setExams(data.exams);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleDelete = async (exam: Exam) => {
        if (!confirm(`Are you sure you want to delete exam "${exam.title}"?`)) return;

        try {
            setDeletingId(exam.id);
            await api.deleteExam(exam.id);
            fetchExams();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete exam");
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePublish = async (exam: Exam) => {
        try {
            await api.updateExam(exam.id, { is_published: !exam.is_published });
            setExams(exams.map(e => e.id === exam.id ? { ...e, is_published: !e.is_published } : e));
        } catch (error) {
            alert("Failed to update status");
            fetchExams();
        }
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exams Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage exams with auto-grading
                    </p>
                </div>
                <Link href="/admin/exams/create">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" /> New Exam
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exams..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Exams Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Exam</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Duration</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Questions</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Submissions</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
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
                                ) : exams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No exams found.
                                        </td>
                                    </tr>
                                ) : (
                                    exams.map((exam) => (
                                        <tr key={exam.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <ClipboardList className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="max-w-[200px]">
                                                        <div className="font-medium truncate" title={exam.title}>{exam.title}</div>
                                                        <div className="text-xs text-muted-foreground">Pass: {exam.passing_score}%</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{exam.duration_minutes} min</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-muted-foreground">{exam.question_count || 0}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span>{exam.submission_count || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={exam.is_published ? "default" : "secondary"}>
                                                    {exam.is_published ? "Published" : "Draft"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleTogglePublish(exam)}
                                                        title={exam.is_published ? "Unpublish" : "Publish"}
                                                    >
                                                        {exam.is_published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                                    </Button>
                                                    <Link href={`/admin/exams/${exam.id}/edit`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" disabled={deletingId === exam.id} onClick={() => handleDelete(exam)}>
                                                        {deletingId === exam.id ? (
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
