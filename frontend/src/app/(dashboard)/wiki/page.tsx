"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, FileText, ChevronRight } from "lucide-react";
import { Input, Card, CardContent } from "@/components/ui";
import { api, type Wiki } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";
import Link from "next/link";

export default function WikiPage() {
    const [wikis, setWikis] = useState<Wiki[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const debouncedSearch = useDebounce(search, 500);

    const fetchWikis = async () => {
        setIsLoading(true);
        try {
            const data = await api.getWikis({
                search: debouncedSearch,
                limit: 50,
            });
            setWikis(data.wikis);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWikis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    return (
        <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight">Knowledge Base</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Browse articles and learning resources
                </p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-12 text-base"
                    />
                </div>
            </div>

            {/* Articles Grid */}
            {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : wikis.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No articles found</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wikis.map((wiki) => (
                        <Link key={wiki.id} href={`/wiki/${wiki.slug}`}>
                            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                                                {wiki.title}
                                            </h3>
                                            {wiki.excerpt && (
                                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                                    {wiki.excerpt}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                <span>By {wiki.author_name || "Unknown"}</span>
                                                <span>•</span>
                                                <span>{new Date(wiki.updated_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
