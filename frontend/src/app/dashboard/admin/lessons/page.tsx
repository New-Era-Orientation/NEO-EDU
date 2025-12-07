"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Link from "next/link";
import { BookOpen, FileQuestion } from "lucide-react";

export default function AdminContentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage Lessons, Wikis, and Exams.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Courses & Lessons
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            To manage Lessons (Video, Text/Wiki, Quiz/Exam), please navigate to the specific Course.
                            Content is organized hierarchically within Courses.
                        </p>
                        <Link href="/dashboard/admin/courses">
                            <Button>Go to Courses</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="w-5 h-5" />
                            Global Exam Bank (Coming Soon)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Future update will allow managing a global bank of questions and exams independent of specific courses.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
