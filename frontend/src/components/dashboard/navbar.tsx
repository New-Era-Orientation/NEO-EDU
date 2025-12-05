"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    Bell,
    Menu,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Wifi,
    WifiOff,
} from "lucide-react";
import { Avatar, Button, Input } from "@/components/ui";
import { useAuthStore, useUIStore, useOfflineStore } from "@/stores";
import { cn } from "@/lib/utils";

export function Navbar() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { toggleSidebar, sidebarCollapsed } = useUIStore();
    const { isOnline } = useOfflineStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard/courses?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header
            className={cn(
                "fixed top-0 right-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm transition-all duration-300",
                sidebarCollapsed ? "left-[72px]" : "left-[280px]"
            )}
        >
            <div className="flex h-full items-center justify-between px-4 lg:px-6">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden sm:block">
                        <Input
                            type="search"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                            className="w-64 lg:w-80"
                        />
                    </form>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Online Status */}
                    <div
                        className={cn(
                            "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                            isOnline
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        )}
                    >
                        {isOnline ? (
                            <>
                                <Wifi className="w-3 h-3" />
                                Online
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-3 h-3" />
                                Offline
                            </>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {/* Notification Badge */}
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg animate-slide-down">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-semibold">Notifications</h3>
                                </div>
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Avatar
                                src={user?.avatar}
                                alt={user?.name}
                                fallback={user?.name}
                                size="sm"
                            />
                            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                                {user?.name}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg animate-slide-down">
                                <div className="p-3 border-b border-border">
                                    <p className="font-medium truncate">{user?.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Profile</span>
                                    </Link>
                                    <Link
                                        href="/dashboard/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-red-600 dark:text-red-400"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Click outside to close menus */}
            {(showUserMenu || showNotifications) && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => {
                        setShowUserMenu(false);
                        setShowNotifications(false);
                    }}
                />
            )}
        </header>
    );
}
