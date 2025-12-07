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
    FileText
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    Badge
} from "@/components/ui";
import { api, type Wiki } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import Link from "next/link";

export default function AdminWikiPage() {
    const [wikis, setWikis] = useState<Wiki[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // Action states
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const debouncedSearch = useDebounce(search, 500);

    // Fetch wikis
    const fetchWikis = async () => {
        setIsLoading(true);
        try {
            const data = await api.getAdminWikis({
                page,
                limit: 10,
                search: debouncedSearch,
            });
            setWikis(data.wikis);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWikis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleDelete = async (wiki: Wiki) => {
        if (!confirm(`Are you sure you want to delete article "${wiki.title}"?`)) return;

        try {
            setDeletingId(wiki.id);
            await api.deleteWiki(wiki.id);
            fetchWikis();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete article");
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePublish = async (wiki: Wiki) => {
        try {
            await api.updateWiki(wiki.id, { is_published: !wiki.is_published });
            // Optimistically update
            setWikis(wikis.map(w => w.id === wiki.id ? { ...w, is_published: !w.is_published } : w));
        } catch (error) {
            alert("Failed to update status");
            fetchWikis(); // Revert on error
        }
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Wiki Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage knowledge base articles
                    </p>
                </div>
                <Link href="/admin/wiki/create">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" /> New Article
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Wikis Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Title</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Slug</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Author</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Updated</th>
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
                                ) : wikis.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No articles found.
                                        </td>
                                    </tr>
                                ) : (
                                    wikis.map((wiki) => (
                                        <tr key={wiki.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="max-w-[200px]">
                                                        <div className="font-medium truncate" title={wiki.title}>{wiki.title}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{wiki.slug}</code>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm">{wiki.author_name || "Unknown"}</span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={wiki.is_published ? "default" : "secondary"}>
                                                    {wiki.is_published ? "Published" : "Draft"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(wiki.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleTogglePublish(wiki)}
                                                        title={wiki.is_published ? "Unpublish" : "Publish"}
                                                    >
                                                        {wiki.is_published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                                    </Button>
                                                    <Link href={`/admin/wiki/${wiki.id}/edit`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" disabled={deletingId === wiki.id} onClick={() => handleDelete(wiki)}>
                                                        {deletingId === wiki.id ? (
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
