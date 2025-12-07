"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Label,
    Badge
} from "@/components/ui";
import { api, type ExamQuestion } from "@/lib/api";
import Link from "next/link";

export default function CreateExamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration_minutes: 60,
        passing_score: 70,
        max_attempts: 1,
        shuffle_questions: false,
        is_published: false,
    });
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_text: "",
                question_type: "multiple-choice",
                options: ["", "", "", ""],
                correct_answer: "",
                points: 1,
                order: questions.length,
            },
        ]);
    };

    const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
        setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert("Title is required");
            return;
        }

        if (questions.length === 0) {
            alert("At least one question is required");
            return;
        }

        try {
            setIsLoading(true);
            await api.createExam({
                ...formData,
                questions,
            });
            router.push("/dashboard/admin/exams");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create exam");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin/exams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
                    <p className="text-muted-foreground mt-1">Build a new exam with questions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Exam Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter exam title"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={1}
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-foreground resize-y text-sm"
                                placeholder="Describe the exam..."
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="passing">Passing Score (%)</Label>
                                <Input
                                    id="passing"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={formData.passing_score}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attempts">Max Attempts</Label>
                                <Input
                                    id="attempts"
                                    type="number"
                                    min={1}
                                    value={formData.max_attempts}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="shuffle"
                                    checked={formData.shuffle_questions}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, shuffle_questions: e.target.checked }))}
                                    className="w-4 h-4 rounded"
                                />
                                <Label htmlFor="shuffle" className="cursor-pointer">Shuffle Questions</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Questions ({questions.length})</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1">
                            <Plus className="w-4 h-4" /> Add Question
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {questions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No questions yet. Click "Add Question" to start.</p>
                        ) : (
                            questions.map((q, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary">Question {index + 1}</Badge>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Question Text *</Label>
                                            <textarea
                                                className="w-full min-h-[80px] p-2 rounded-md border bg-background text-foreground resize-y text-sm"
                                                placeholder="Enter question..."
                                                value={q.question_text}
                                                onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <select
                                                className="w-full p-2 rounded-md border bg-background text-foreground"
                                                value={q.question_type}
                                                onChange={(e) => updateQuestion(index, { question_type: e.target.value as ExamQuestion["question_type"] })}
                                            >
                                                <option value="multiple-choice">Multiple Choice</option>
                                                <option value="true-false">True/False</option>
                                                <option value="short-answer">Short Answer</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Points</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={q.points}
                                                onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>

                                        {q.question_type === "multiple-choice" && (
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Options (one per line)</Label>
                                                <textarea
                                                    className="w-full min-h-[80px] p-2 rounded-md border bg-background text-foreground resize-y text-sm"
                                                    placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                                                    value={q.options?.join("\n") || ""}
                                                    onChange={(e) => updateQuestion(index, { options: e.target.value.split("\n") })}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Correct Answer *</Label>
                                            {q.question_type === "true-false" ? (
                                                <select
                                                    className="w-full p-2 rounded-md border bg-background text-foreground"
                                                    value={q.correct_answer}
                                                    onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="true">True</option>
                                                    <option value="false">False</option>
                                                </select>
                                            ) : (
                                                <Input
                                                    placeholder={q.question_type === "multiple-choice" ? "Enter correct option text" : "Enter correct answer"}
                                                    value={q.correct_answer}
                                                    onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <div className="flex items-center gap-2 mr-auto">
                        <input
                            type="checkbox"
                            id="publish"
                            checked={formData.is_published}
                            onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                            className="w-4 h-4 rounded"
                        />
                        <Label htmlFor="publish" className="cursor-pointer">Publish immediately</Label>
                    </div>
                    <Link href="/dashboard/admin/exams">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Create Exam
                    </Button>
                </div>
            </form>
        </div>
    );
}
