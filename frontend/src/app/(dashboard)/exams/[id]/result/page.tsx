"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { api, type ExamSubmission } from "@/lib/api";
import Link from "next/link";

interface ExamResultPageProps {
    params: Promise<{ id: string }>;
}

export default function ExamResultPage({ params }: ExamResultPageProps) {
    const { id } = use(params);
    const [result, setResult] = useState<ExamSubmission | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                setIsLoading(true);
                const data = await api.getExamResult(id);
                setResult(data.result);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [id]);

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No result found for this exam</p>
                <Link href="/exams">
                    <Button variant="outline" className="mt-4">Back to Exams</Button>
                </Link>
            </div>
        );
    }

    const passed = result.passed;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/exams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exam Result</h1>
                    <p className="text-muted-foreground mt-1">{result.exam_title}</p>
                </div>
            </div>

            {/* Result Card */}
            <Card className={`border-2 ${passed ? "border-green-500" : "border-red-500"}`}>
                <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? "bg-green-100" : "bg-red-100"}`}>
                        {passed ? (
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        ) : (
                            <XCircle className="w-12 h-12 text-red-600" />
                        )}
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${passed ? "text-green-600" : "text-red-600"}`}>
                        {passed ? "Congratulations!" : "Keep Trying!"}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {passed ? "You have passed the exam." : "You did not pass this time."}
                    </p>

                    <div className="text-6xl font-bold mb-2">
                        {result.score}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Passing Score: {result.passing_score}%
                    </p>
                </CardContent>
            </Card>

            {/* Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={passed ? "default" : "destructive"}>
                            {passed ? "PASSED" : "FAILED"}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium">{result.score}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Submitted At</span>
                        <span className="font-medium">
                            {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "N/A"}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Link href="/exams">
                    <Button variant="outline">Back to Exams</Button>
                </Link>
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
}
