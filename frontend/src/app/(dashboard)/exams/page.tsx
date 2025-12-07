"use client";

import { useState, useEffect } from "react";
import { Loader2, ClipboardList, Clock, Award, ChevronRight } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { api, type Exam } from "@/lib/api";
import Link from "next/link";

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                setIsLoading(true);
                const data = await api.getExams({ limit: 50 });
                setExams(data.exams);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExams();
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight">Available Exams</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Test your knowledge and track your progress
                </p>
            </div>

            {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No exams available at the moment</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam) => (
                        <Link key={exam.id} href={`/exams/${exam.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <ClipboardList className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                                                {exam.title}
                                            </h3>
                                            {exam.description && (
                                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                                    {exam.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{exam.duration_minutes} min</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Award className="w-3.5 h-3.5" />
                                                    <span>Pass: {exam.passing_score}%</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {exam.question_count || 0} questions
                                                </Badge>
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
