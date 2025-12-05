"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, Users, Star, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCourses } from "@/lib/hooks";
import { formatDuration, truncate, cn } from "@/lib/utils";

const categories = [
    { key: "all", label: "All" },
    { key: "programming", label: "Programming" },
    { key: "design", label: "Design" },
    { key: "business", label: "Business" },
    { key: "languages", label: "Languages" },
];

export default function PublicCoursesPage() {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const { data: coursesData, isLoading } = useCourses({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
    });

    const courses = coursesData?.courses || [];

    // Filter only public courses (if course has is_public or similar field)
    const publicCourses = courses.filter((c) => c.published);

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/assets/logo.png"
                                alt="NEO EDU Logo"
                                width={40}
                                height={40}
                                className="rounded-lg"
                                priority
                            />
                            <span className="text-xl font-bold gradient-text">NEO EDU</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {t("auth.signIn")}
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                            >
                                {t("auth.createAccount")}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="pt-24 pb-8 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-2">{t("courses.browse")}</h1>
                    <p className="text-muted-foreground">{t("courses.browseDesc")}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder={t("navbar.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                selectedCategory === cat.key
                                    ? "gradient-primary text-white"
                                    : "bg-muted hover:bg-muted/80 text-foreground"
                            )}
                        >
                            {cat.key === "all" ? t("courses.filters.all") : cat.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
                    </div>
                )}

                {/* Course Grid */}
                {!isLoading && (
                    <>
                        {publicCourses.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {publicCourses.map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.id}`}
                                        className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-muted">
                                            {course.thumbnail ? (
                                                <Image
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 gradient-primary opacity-20" />
                                            )}
                                            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">
                                                {course.category}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {truncate(course.description, 80)}
                                            </p>

                                            {/* Instructor */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-medium">
                                                    {course.instructor_name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {course.instructor_name}
                                                </span>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatDuration(course.duration)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{course.enrolled_count}</span>
                                                </div>
                                                {course.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span>{course.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">{t("common.noResults")}</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CTA */}
            <div className="bg-muted/30 py-12 mt-12">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">
                        Muốn theo dõi tiến độ học tập?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Tạo tài khoản miễn phí để lưu tiến độ và nhận chứng chỉ hoàn thành.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white font-semibold rounded-lg"
                    >
                        {t("auth.createAccount")}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
