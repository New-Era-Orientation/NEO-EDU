"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, FileText, Clock, User } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { api, type Wiki } from "@/lib/api";
import Link from "next/link";

interface WikiDetailPageProps {
    params: Promise<{ slug: string }>;
}

export default function WikiDetailPage({ params }: WikiDetailPageProps) {
    const { slug } = use(params);
    const [wiki, setWiki] = useState<Wiki | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWiki = async () => {
            try {
                setIsLoading(true);
                const data = await api.getWiki(slug);
                setWiki(data.wiki);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Article not found");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWiki();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !wiki) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">{error || "Article not found"}</p>
                <Link href="/wiki">
                    <Button variant="outline">Back to Wiki</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/wiki">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{wiki.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {wiki.author_name || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Updated {new Date(wiki.updated_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <Card>
                <CardContent className="p-6 md:p-8">
                    {wiki.content ? (
                        <article
                            className="prose prose-neutral dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: wiki.content }}
                        />
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            This article has no content yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
