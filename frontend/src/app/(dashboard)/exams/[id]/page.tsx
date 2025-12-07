"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Clock, Award, Play, CheckCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { api, type Exam, type ExamSubmission } from "@/lib/api";
import Link from "next/link";

interface ExamDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function ExamDetailPage({ params }: ExamDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [submission, setSubmission] = useState<ExamSubmission | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const examData = await api.getExam(id);
                setExam(examData.exam);

                // Check if user has a result
                try {
                    const resultData = await api.getExamResult(id);
                    setSubmission(resultData.result);
                } catch {
                    // No submission yet
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleStartExam = async () => {
        try {
            setIsStarting(true);
            await api.startExam(id);
            router.push(`/exams/${id}/take`);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to start exam");
        } finally {
            setIsStarting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Exam not found</p>
                <Link href="/exams">
                    <Button variant="outline" className="mt-4">Back to Exams</Button>
                </Link>
            </div>
        );
    }

    const hasCompleted = submission?.submitted_at;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/exams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
                    {exam.course_title && (
                        <p className="text-muted-foreground mt-1">Course: {exam.course_title}</p>
                    )}
                </div>
            </div>

            {/* Exam Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {exam.description && (
                        <p className="text-muted-foreground">{exam.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="text-sm text-muted-foreground">Duration</div>
                                <div className="font-medium">{exam.duration_minutes} minutes</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="text-sm text-muted-foreground">Passing Score</div>
                                <div className="font-medium">{exam.passing_score}%</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Questions</div>
                            <div className="font-medium">{exam.question_count || 0}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Max Attempts</div>
                            <div className="font-medium">{exam.max_attempts}</div>
                        </div>
                    </div>

                    {/* Result or Start Button */}
                    {hasCompleted ? (
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-8 h-8 ${submission.passed ? "text-green-500" : "text-red-500"}`} />
                                    <div>
                                        <div className="font-medium">
                                            {submission.passed ? "Passed!" : "Not Passed"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Score: {submission.score}%
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/exams/${id}/result`}>
                                    <Button>View Details</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 border-t flex justify-center">
                            <Button size="lg" onClick={handleStartExam} disabled={isStarting} className="gap-2">
                                {isStarting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                                Start Exam
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Read each question carefully before answering.</li>
                        <li>• You have {exam.duration_minutes} minutes to complete the exam.</li>
                        <li>• The timer starts when you click "Start Exam".</li>
                        <li>• You need at least {exam.passing_score}% to pass.</li>
                        <li>• You can only attempt this exam {exam.max_attempts} time(s).</li>
                        {exam.shuffle_questions && (
                            <li>• Questions will be displayed in random order.</li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
