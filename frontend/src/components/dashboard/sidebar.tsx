"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    BarChart3,
    Settings,
    Users,
    PlusCircle,
    ChevronLeft,
    ChevronRight,
    Shield,
    FileText,
    Trophy,
    BookMarked,
    ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@/stores";

const studentNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "Browse Courses", icon: BookOpen },
    { href: "/dashboard/my-courses", label: "My Courses", icon: GraduationCap },
    { href: "/dashboard/progress", label: "Progress", icon: BarChart3 },
];

const instructorNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "All Courses", icon: BookOpen },
    { href: "/dashboard/my-courses", label: "My Courses", icon: GraduationCap },
    { href: "/dashboard/create-course", label: "Create Course", icon: PlusCircle },
    { href: "/dashboard/students", label: "Students", icon: Users },
];

const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin", label: "Admin Panel", icon: Shield },
    { href: "/dashboard/admin/analytics", label: "Thống kê", icon: BarChart3 },
    { href: "/dashboard/admin/users", label: "Quản lý Users", icon: Users },
    { href: "/dashboard/admin/courses", label: "Quản lý Courses", icon: BookOpen },
    { href: "/dashboard/admin/lessons", label: "Quản lý Lessons", icon: FileText },
    { href: "/dashboard/admin/contests", label: "Quản lý Contests", icon: Trophy },
    { href: "/dashboard/admin/exams", label: "Quản lý Exams", icon: ClipboardList },
    { href: "/dashboard/admin/wiki", label: "Quản lý Wiki", icon: BookMarked },
    { href: "/dashboard/admin/settings", label: "Cài đặt hệ thống", icon: Settings },
];

const bottomNavItems = [
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
    const { user } = useAuthStore();

    const isAdmin = user?.role === "admin";
    const isInstructor = user?.role === "instructor";

    // Choose navigation based on role
    let navItems = studentNavItems;
    if (isAdmin) {
        navItems = adminNavItems;
    } else if (isInstructor) {
        navItems = instructorNavItems;
    }

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
                sidebarCollapsed ? "w-[72px]" : "w-[280px]"
            )}
        >
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <Image
                            src="/assets/logo.png"
                            alt="NEO EDU"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        {!sidebarCollapsed && (
                            <span className="text-lg font-bold gradient-text">NEO EDU</span>
                        )}
                    </Link>
                    <button
                        onClick={toggleSidebarCollapse}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Navigation */}
                <div className="border-t border-border p-3 space-y-1">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
