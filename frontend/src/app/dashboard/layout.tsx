"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Navbar } from "@/components/dashboard";
import { useAuthStore, useUIStore, useOfflineStore } from "@/stores";
import { LoadingPage } from "@/components/ui";
import { cn } from "@/lib/utils";

// Routes that guests can access without authentication
const PUBLIC_ROUTES = [
    "/dashboard",
    "/dashboard/courses",
    "/dashboard/wiki",
    "/dashboard/exams",
];

// Check if current path is public (including dynamic routes like /dashboard/courses/[id])
function isPublicRoute(pathname: string): boolean {
    // Exact matches
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    // Public dynamic routes
    if (pathname.startsWith("/dashboard/courses/") && !pathname.includes("/lessons/")) return true;
    if (pathname.startsWith("/dashboard/wiki/")) return true;
    if (pathname.startsWith("/dashboard/exams/") && !pathname.includes("/take") && !pathname.includes("/result")) return true;

    return false;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, token, setLoading } = useAuthStore();
    const { sidebarCollapsed } = useUIStore();
    const { setOnline } = useOfflineStore();

    const isPublic = isPublicRoute(pathname);

    // Check authentication
    useEffect(() => {
        // Check if we have a token in localStorage
        const storedAuth = localStorage.getItem("neo-edu-auth");
        if (storedAuth) {
            try {
                const parsed = JSON.parse(storedAuth);
                if (parsed?.state?.token) {
                    setLoading(false);
                    return;
                }
            } catch (e) {
                // Invalid stored auth
            }
        }

        // Allow public routes without auth
        if (isPublic) {
            setLoading(false);
            return;
        }

        if (!isLoading && !isAuthenticated && !token) {
            router.push("/login");
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, isLoading, token, router, setLoading, isPublic]);

    // Online/Offline detection
    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [setOnline]);

    // Show loading while checking auth
    if (isLoading) {
        return <LoadingPage text="Loading..." />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div
                className={cn(
                    "min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
                )}
            >
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="pt-16 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
