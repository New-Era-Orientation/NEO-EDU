"use client";

import Link from "next/link";
import {
    BookOpen,
    FileText,
    GraduationCap,
    TrendingUp,
    ArrowRight,
    Clock,
    Star,
    Users,
    Search
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input, LoadingPage } from "@/components/ui";
import { GuestSignupPrompt, useIsGuest } from "@/components/dashboard";
import { useAuthStore } from "@/stores";
import { useCourses, useWikis, useExams } from "@/lib/hooks";
import type { Wiki, Exam } from "@/lib/api";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const isGuest = useIsGuest();
    const { data: coursesData, isLoading: coursesLoading } = useCourses({ limit: 6 });
    const { data: wikisData, isLoading: wikisLoading } = useWikis({ limit: 4 });
    const { data: examsData, isLoading: examsLoading } = useExams({ limit: 4 });

    const isLoading = coursesLoading || wikisLoading || examsLoading;

    if (isLoading) {
        return <LoadingPage />;
    }

    const courses = coursesData?.courses || [];
    const wikis = wikisData?.wikis || [];
    const exams = examsData?.exams || [];

    // Sort for popular (by enrolled_count) and latest (by created_at)
    const popularCourses = [...courses].sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0)).slice(0, 3);
    const latestCourses = [...courses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-10 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-4xl font-bold mb-2">
                        Chào mừng{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
                    </h1>
                    <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl">
                        Khám phá kho tài liệu học tập phong phú với các khóa học, bài kiểm tra và wiki được cập nhật liên tục.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm tài liệu, khóa học..."
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                        />
                    </div>
                </div>

                {/* Stats Floating Cards */}
                <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold">{courses.length} Khóa học</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                        <FileText className="w-5 h-5" />
                        <span className="font-semibold">{wikis.length} Wiki</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                        <GraduationCap className="w-5 h-5" />
                        <span className="font-semibold">{exams.length} Bài thi</span>
                    </div>
                </div>
            </section>

            {/* Quick Links - Mobile */}
            <div className="grid grid-cols-3 gap-3 lg:hidden">
                <Link href="/courses" className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border hover:border-primary transition-colors">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-medium">Khóa học</span>
                </Link>
                <Link href="/exams" className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border hover:border-primary transition-colors">
                    <GraduationCap className="w-6 h-6 text-green-500" />
                    <span className="text-xs font-medium">Bài thi</span>
                </Link>
                <Link href="/wiki" className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border hover:border-primary transition-colors">
                    <FileText className="w-6 h-6 text-purple-500" />
                    <span className="text-xs font-medium">Wiki</span>
                </Link>
            </div>

            {/* Popular Documents Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg md:text-xl font-semibold">Tài liệu phổ biến</h2>
                    </div>
                    <Link href="/courses" className="text-sm text-primary hover:underline flex items-center gap-1">
                        Xem tất cả <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Desktop: 3 columns, Mobile: Horizontal scroll */}
                <div className="hidden md:grid md:grid-cols-3 gap-4">
                    {popularCourses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
                                <CardContent className="p-4">
                                    <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <BookOpen className="w-10 h-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="mb-2">{course.category || "Khóa học"}</Badge>
                                    <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {course.enrolled_count || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" />
                                            {course.rating?.toFixed(1) || "N/A"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Mobile: Horizontal scroll */}
                <div className="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {popularCourses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.id}`} className="min-w-[260px] flex-shrink-0">
                            <Card className="h-full hover:border-primary/50 transition-all">
                                <CardContent className="p-3">
                                    <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-2 flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <Badge variant="secondary" className="mb-1 text-[10px]">{course.category || "Khóa học"}</Badge>
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{course.title}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {course.enrolled_count || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" /> {course.rating?.toFixed(1) || "N/A"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Latest Documents Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg md:text-xl font-semibold">Tài liệu mới nhất</h2>
                    </div>
                    <Link href="/courses" className="text-sm text-primary hover:underline flex items-center gap-1">
                        Xem tất cả <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Desktop: Grid, Mobile: List */}
                <div className="hidden md:grid md:grid-cols-3 gap-4">
                    {latestCourses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge variant="outline" className="mb-1 text-[10px]">Mới</Badge>
                                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(course.created_at).toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Mobile: List view */}
                <div className="md:hidden space-y-2">
                    {latestCourses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                            <Card className="hover:border-primary/50 transition-all">
                                <CardContent className="p-3 flex gap-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm line-clamp-1">{course.title}</h3>
                                        <p className="text-xs text-muted-foreground">{course.category || "Khóa học"}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(course.created_at).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Wiki & Exams Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Wiki Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-semibold">Wiki</h2>
                        </div>
                        <Link href="/wiki" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {wikis.length > 0 ? wikis.map((wiki) => (
                            <Link key={wiki.id} href={`/wiki/${wiki.slug}`}>
                                <Card className="hover:border-primary/50 transition-all">
                                    <CardContent className="p-3 flex gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm line-clamp-1">{wiki.title}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{wiki.excerpt || "Xem chi tiết"}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Chưa có wiki nào</p>
                        )}
                    </div>
                </section>

                {/* Exams Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-green-500" />
                            <h2 className="text-lg font-semibold">Bài thi</h2>
                        </div>
                        <Link href="/exams" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {exams.length > 0 ? exams.map((exam) => (
                            <Link key={exam.id} href={`/exams/${exam.id}`}>
                                <Card className="hover:border-primary/50 transition-all">
                                    <CardContent className="p-3 flex gap-3">
                                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <GraduationCap className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm line-clamp-1">{exam.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{exam.duration_minutes} phút</span>
                                                <span>•</span>
                                                <span>Đạt: {exam.passing_score}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Chưa có bài thi nào</p>
                        )}
                    </div>
                </section>
            </div>

            {/* CTA Section - Show different content for guest */}
            {isGuest ? (
                <section className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 md:p-8 text-center">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Bắt đầu học ngay hôm nay!</h2>
                    <p className="text-muted-foreground mb-4 text-sm md:text-base">
                        Đăng ký miễn phí để lưu tiến độ và truy cập nhiều tính năng hơn
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/signup">
                            <Button size="lg" className="w-full sm:w-auto">
                                Tạo tài khoản miễn phí
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Đăng nhập
                            </Button>
                        </Link>
                    </div>
                </section>
            ) : (
                <section className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 md:p-8 text-center">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Tiếp tục học tập!</h2>
                    <p className="text-muted-foreground mb-4 text-sm md:text-base">
                        Khám phá khóa học mới hoặc tiếp tục tiến độ của bạn
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/courses">
                            <Button size="lg" className="w-full sm:w-auto">
                                Khám phá khóa học
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/dashboard/my-courses">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Khóa học của tôi
                            </Button>
                        </Link>
                    </div>
                </section>
            )}

            {/* Guest Signup Banner */}
            {isGuest && <GuestSignupPrompt variant="banner" />}
        </div>
    );
}

