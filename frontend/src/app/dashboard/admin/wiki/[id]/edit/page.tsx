"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Label
} from "@/components/ui";
import { api, type Wiki } from "@/lib/api";
import Link from "next/link";

interface EditWikiPageProps {
    params: Promise<{ id: string }>;
}

export default function EditWikiPage({ params }: EditWikiPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [wiki, setWiki] = useState<Wiki | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        is_published: false,
    });

    useEffect(() => {
        const fetchWiki = async () => {
            try {
                setIsLoading(true);
                const data = await api.getWikiById(id);
                setWiki(data.wiki);
                setFormData({
                    title: data.wiki.title,
                    slug: data.wiki.slug,
                    excerpt: data.wiki.excerpt || "",
                    content: data.wiki.content || "",
                    is_published: data.wiki.is_published,
                });
            } catch (error) {
                console.error(error);
                alert("Failed to load article");
                router.push("/admin/wiki");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWiki();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.slug.trim()) {
            alert("Title and slug are required");
            return;
        }

        try {
            setIsSaving(true);
            await api.updateWiki(id, formData);
            router.push("/admin/wiki");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update article");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!wiki) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Article not found</p>
                <Link href="/admin/wiki">
                    <Button variant="outline" className="mt-4">Back to Wiki</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/wiki">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Wiki Article</h1>
                    <p className="text-muted-foreground mt-1">Update article details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Article Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter article title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">
                                    Slug *
                                    <span className="text-xs text-muted-foreground ml-1">(URL path)</span>
                                </Label>
                                <Input
                                    id="slug"
                                    placeholder="article-url-slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    required
                                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                    title="Lowercase letters, numbers, and hyphens only"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Input
                                id="excerpt"
                                placeholder="Brief description of the article"
                                value={formData.excerpt}
                                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                maxLength={500}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content (Markdown/HTML)</Label>
                            <textarea
                                id="content"
                                className="w-full min-h-[300px] p-3 rounded-md border bg-background text-foreground resize-y font-mono text-sm"
                                placeholder="Write your article content here..."
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                checked={formData.is_published}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_published" className="cursor-pointer">
                                Published
                            </Label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link href="/admin/wiki">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={isSaving} className="gap-2">
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
