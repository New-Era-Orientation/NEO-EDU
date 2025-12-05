"use client";

import { useState } from "react";
import {
    Moon,
    Sun,
    Monitor,
    Bell,
    Shield,
    Download,
    Trash2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
} from "@/components/ui";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { theme, setTheme } = useUIStore();
    const [notifications, setNotifications] = useState(true);

    const themeOptions = [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ] as const;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Customize your learning experience
                </p>
            </div>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="w-5 h-5" />
                        Appearance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <label className="block text-sm font-medium mb-3">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            {themeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTheme(option.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        theme === option.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground"
                                    )}
                                >
                                    <option.icon className="w-6 h-6" />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications about new courses and updates
                            </p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                notifications ? "bg-primary" : "bg-muted"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    notifications ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Data & Storage */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Data & Storage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Offline Storage</p>
                            <p className="text-sm text-muted-foreground">
                                Currently using 128 MB for offline courses
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Manage
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Clear Cache</p>
                            <p className="text-sm text-muted-foreground">
                                Free up space by clearing cached content
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Security
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Change Password</p>
                            <p className="text-sm text-muted-foreground">
                                Update your account password
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Update
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Trash2 className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button variant="destructive" size="sm">
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
