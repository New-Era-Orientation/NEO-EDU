"use client";

import Link from "next/link";
import { Users, BookOpen, FileText, Shield, ArrowRight, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function AdminDashboardPage() {
    const stats = [
        {
            label: "Quản lý Users",
            value: "Users & Roles",
            icon: Users,
            href: "/dashboard/admin/users",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Quản lý Courses",
            value: "Courses & Content",
            icon: BookOpen,
            href: "/dashboard/admin/courses",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: "Quản lý Lessons",
            value: "Wiki & Extras",
            icon: FileText,
            href: "/dashboard/admin/lessons",
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            label: "Quản lý Contests",
            value: "Cuộc thi & Live",
            icon: Trophy,
            href: "/dashboard/admin/contests",
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Quản lý toàn bộ hệ thống NEO EDU từ đây.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {stats.map((stat) => (
                    <Link key={stat.href} href={stat.href}>
                        <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">{stat.value}</div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    Truy cập ngay <ArrowRight className="ml-1 w-3 h-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <CardTitle>Admin Access</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Bạn đang đăng nhập với quyền <strong>Admin</strong>. Bạn có toàn quyền kiểm soát hệ thống, bao gồm tạo/xóa tài khoản, quản lý nội dung khóa học và xem thống kê chi tiết.
                        Hãy cẩn thận khi thực hiện các hành động nhạy cảm như xóa dữ liệu.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
