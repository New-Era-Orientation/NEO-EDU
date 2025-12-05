"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Grid, List, Filter } from "lucide-react";
import { Input, Button, Badge, LoadingPage } from "@/components/ui";
import { CourseCard } from "@/components/dashboard";
import { useCourses, useSearchCourses } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const categories = [
    "All",
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Data Science",
    "Languages",
];

export default function CoursesPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const { data: coursesData, isLoading } = useCourses({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: searchQuery || undefined,
    });

    const courses = coursesData?.courses || [];

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Browse Courses</h1>
                <p className="text-muted-foreground mt-1">
                    Explore our collection of high-quality courses
                </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <Input
                        type="search"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                    >
                        <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            selectedCategory === category
                                ? "gradient-primary text-white"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{courses.length}</span> courses
                </p>
            </div>

            {/* Course Grid/List */}
            {courses.length > 0 ? (
                <div
                    className={cn(
                        "gap-4 lg:gap-6",
                        viewMode === "grid"
                            ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col"
                    )}
                >
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                    <p className="text-muted-foreground mb-6">
                        Try adjusting your search or filter to find what you&apos;re looking for.
                    </p>
                    <Button variant="outline" onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                    }}>
                        Clear filters
                    </Button>
                </div>
            )}
        </div>
    );
}
