"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { api, type Exam, type ExamQuestion } from "@/lib/api";

interface TakeExamPageProps {
    params: Promise<{ id: string }>;
}

export default function TakeExamPage({ params }: TakeExamPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setIsLoading(true);
                const data = await api.getExamQuestions(id);
                setExam(data.exam);
                setQuestions(data.questions);
                setTimeLeft(data.exam.duration_minutes * 60);
            } catch (error) {
                console.error(error);
                alert("Failed to load exam questions");
                router.push(`/exams/${id}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [id, router]);

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const result = await api.submitExam(id, answers);
            alert(`Exam submitted! Score: ${result.score}% - ${result.passed ? "PASSED" : "NOT PASSED"}`);
            router.push(`/exams/${id}/result`);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to submit exam");
        } finally {
            setIsSubmitting(false);
        }
    }, [id, answers, router, isSubmitting]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || isLoading) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isLoading, handleSubmit]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!exam || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load exam</p>
            </div>
        );
    }

    const answeredCount = Object.keys(answers).length;
    const isTimeWarning = timeLeft < 60;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header with Timer */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{exam.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {answeredCount} of {questions.length} answered
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isTimeWarning ? "bg-red-100 text-red-700" : "bg-muted"}`}>
                        {isTimeWarning && <AlertTriangle className="w-5 h-5" />}
                        <Clock className="w-5 h-5" />
                        <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {questions.map((question, index) => (
                    <Card key={question.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Badge variant="secondary" className="mt-1">
                                    {index + 1}
                                </Badge>
                                <div className="flex-1 space-y-4">
                                    <p className="font-medium">{question.question_text}</p>
                                    <div className="text-xs text-muted-foreground">
                                        {question.points} point{question.points > 1 ? "s" : ""}
                                    </div>

                                    {/* Answer Input */}
                                    {question.question_type === "multiple-choice" && question.options && (
                                        <div className="space-y-2">
                                            {question.options.filter(o => o.trim()).map((option, optIndex) => (
                                                <label
                                                    key={optIndex}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[question.id!] === option
                                                        ? "border-primary bg-primary/5"
                                                        : "hover:bg-muted/50"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`q-${question.id}`}
                                                        value={option}
                                                        checked={answers[question.id!] === option}
                                                        onChange={() => handleAnswerChange(question.id!, option)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.question_type === "true-false" && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Chọn Đ (Đúng) hoặc S (Sai) cho mỗi ý:
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {["a", "b", "c", "d"].map((sub, subIndex) => {
                                                    const currentAnswers = (answers[question.id!] || "").split("");
                                                    const currentValue = currentAnswers[subIndex] || "";

                                                    return (
                                                        <div key={sub} className="flex flex-col items-center gap-1">
                                                            <span className="text-sm font-medium">{sub})</span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newAnswers = [...currentAnswers];
                                                                        while (newAnswers.length < 4) newAnswers.push("");
                                                                        newAnswers[subIndex] = "Đ";
                                                                        handleAnswerChange(question.id!, newAnswers.join(""));
                                                                    }}
                                                                    className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${currentValue === "Đ"
                                                                            ? "bg-green-500 text-white border-green-500"
                                                                            : "hover:bg-muted"
                                                                        }`}
                                                                >
                                                                    Đ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newAnswers = [...currentAnswers];
                                                                        while (newAnswers.length < 4) newAnswers.push("");
                                                                        newAnswers[subIndex] = "S";
                                                                        handleAnswerChange(question.id!, newAnswers.join(""));
                                                                    }}
                                                                    className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${currentValue === "S"
                                                                            ? "bg-red-500 text-white border-red-500"
                                                                            : "hover:bg-muted"
                                                                        }`}
                                                                >
                                                                    S
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Điểm: 1 ý đúng = 0.1đ, 2 ý = 0.25đ, 3 ý = 0.5đ, 4 ý = 1đ
                                            </p>
                                        </div>
                                    )}

                                    {question.question_type === "short-answer" && (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                placeholder="Nhập đáp án (VD: -2,5)"
                                                value={answers[question.id!] || ""}
                                                onChange={(e) => {
                                                    // Only allow numbers, comma, minus, space
                                                    const value = e.target.value.replace(/[^0-9,\-\s]/g, "");
                                                    if (value.length <= 10) {
                                                        handleAnswerChange(question.id!, value);
                                                    }
                                                }}
                                                maxLength={10}
                                                className="w-40 p-3 rounded-lg border bg-background font-mono text-center text-lg"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Chỉ nhập số, dấu phẩy và dấu âm
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center py-6">
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting || answeredCount === 0}
                    className="min-w-[200px]"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        `Submit Exam (${answeredCount}/${questions.length})`
                    )}
                </Button>
            </div>
        </div>
    );
}
