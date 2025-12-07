"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Trophy,
    Calendar,
    Users,
    Clock,
    Eye
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    Badge
} from "@/components/ui";
import { api, type Contest } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import Link from "next/link";

export default function AdminContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingContest, setEditingContest] = useState<Contest | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        time_limit: 60,
        passing_score: 70,
        start_time: "",
        end_time: "",
        max_participants: undefined as number | undefined,
        is_public: true,
        status: "draft" as Contest["status"],
    });

    const debouncedSearch = useDebounce(search, 500);

    const fetchContests = async () => {
        setIsLoading(true);
        try {
            const data = await api.getAdminContests({
                page,
                limit: 10,
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
            });
            setContests(data.contests);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContests();
    }, [page, debouncedSearch, statusFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createContest({
                ...formData,
                questions: [],
            });
            setIsCreateOpen(false);
            resetForm();
            fetchContests();
            alert("Contest created successfully!");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create contest");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContest) return;
        try {
            await api.updateContest(editingContest.id, formData);
            setEditingContest(null);
            resetForm();
            fetchContests();
            alert("Contest updated successfully!");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update contest");
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        if (!confirm("Are you sure you want to delete this contest?")) return;

        try {
            await api.deleteContest(deletingId);
            setDeletingId(null);
            fetchContests();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete contest");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            time_limit: 60,
            passing_score: 70,
            start_time: "",
            end_time: "",
            max_participants: undefined,
            is_public: true,
            status: "draft",
        });
    };

    const openEdit = (contest: Contest) => {
        setFormData({
            title: contest.title,
            description: contest.description || "",
            time_limit: contest.time_limit,
            passing_score: contest.passing_score,
            start_time: contest.start_time.slice(0, 16),
            end_time: contest.end_time.slice(0, 16),
            max_participants: contest.max_participants,
            is_public: contest.is_public,
            status: contest.status,
        });
        setEditingContest(contest);
    };

    const getStatusColor = (status: Contest["status"]) => {
        switch (status) {
            case "draft": return "secondary";
            case "upcoming": return "outline";
            case "active": return "default";
            case "ended": return "destructive";
            default: return "secondary";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-orange-500" />
                        Contest Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage contests with live leaderboard
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Contest
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    className="h-10 px-3 rounded-md border bg-background text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                </select>
            </div>

            {/* Contests Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Contest</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Time</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Participants</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : contests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No contests found.
                                        </td>
                                    </tr>
                                ) : (
                                    contests.map((contest) => (
                                        <tr key={contest.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium">{contest.title}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {contest.time_limit} phút
                                                        <span className="mx-1">•</span>
                                                        {contest.question_count || 0} câu hỏi
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={getStatusColor(contest.status)} className="capitalize">
                                                    {contest.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(contest.start_time)}
                                                    </div>
                                                    <div className="text-muted-foreground mt-1">
                                                        → {formatDate(contest.end_time)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    {contest.participant_count || 0}
                                                    {contest.max_participants && (
                                                        <span>/ {contest.max_participants}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/admin/contests/${contest.id}`}>
                                                        <Button variant="ghost" size="icon" title="View Details">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(contest)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600"
                                                        onClick={() => {
                                                            setDeletingId(contest.id);
                                                            handleDelete();
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

            {/* Create/Edit Modal */}
            {(isCreateOpen || editingContest) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {editingContest ? "Edit Contest" : "Create Contest"}
                            </h2>
                            <form onSubmit={editingContest ? handleUpdate : handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Time Limit (minutes)</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.time_limit}
                                            onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Passing Score (%)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={formData.passing_score}
                                            onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Start Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Max Participants (optional)</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.max_participants || ""}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                max_participants: e.target.value ? parseInt(e.target.value) : undefined
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Contest["status"] })}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="upcoming">Upcoming</option>
                                            <option value="active">Active</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_public"
                                        checked={formData.is_public}
                                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                    />
                                    <label htmlFor="is_public" className="text-sm">Public contest</label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreateOpen(false);
                                            setEditingContest(null);
                                            resetForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingContest ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
