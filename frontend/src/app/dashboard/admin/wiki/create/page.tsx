"use client";

import { useState } from "react";
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
import { api } from "@/lib/api";
import Link from "next/link";

export default function CreateWikiPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        is_published: false,
    });

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: prev.slug || generateSlug(title), // Only auto-generate if slug is empty
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.slug.trim()) {
            alert("Title and slug are required");
            return;
        }

        try {
            setIsLoading(true);
            await api.createWiki(formData);
            router.push("/admin/wiki");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create article");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/wiki">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Wiki Article</h1>
                    <p className="text-muted-foreground mt-1">Add a new article to the knowledge base</p>
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
                                    onChange={handleTitleChange}
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
                                Publish immediately
                            </Label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link href="/admin/wiki">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={isLoading} className="gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Create Article
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
