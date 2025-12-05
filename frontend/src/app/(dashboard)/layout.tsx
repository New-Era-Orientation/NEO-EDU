"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Navbar } from "@/components/dashboard";
import { useAuthStore, useUIStore, useOfflineStore } from "@/stores";
import { LoadingPage } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, token, setLoading } = useAuthStore();
    const { sidebarCollapsed } = useUIStore();
    const { setOnline } = useOfflineStore();

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

        if (!isLoading && !isAuthenticated && !token) {
            router.push("/login");
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, isLoading, token, router, setLoading]);

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
