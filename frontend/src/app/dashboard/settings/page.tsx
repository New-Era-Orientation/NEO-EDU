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
    Languages,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
} from "@/components/ui";
import { useUIStore, useAuthStore } from "@/stores";
import { useI18n, languageNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { theme, setTheme, notifications, setNotifications, isSyncing } = useUIStore();
    const { isAuthenticated } = useAuthStore();
    const { locale, setLocale, t } = useI18n();

    const themeOptions = [
        { value: "light", label: t("settings.light"), icon: Sun },
        { value: "dark", label: t("settings.dark"), icon: Moon },
        { value: "system", label: t("settings.system"), icon: Monitor },
    ] as const;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">{t("settings.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("settings.titleDesc")}
                    </p>
                </div>
                {isSyncing && isAuthenticated && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Syncing...</span>
                    </div>
                )}
            </div>

            {/* Sync Info */}
            {isAuthenticated && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
                    ✓ {t("settings.syncEnabled") || "Settings are synced to your account"}
                </div>
            )}

            {/* Language */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {t("settings.language")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {locales.map((loc) => (
                            <button
                                key={loc}
                                onClick={() => setLocale(loc)}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                    locale === loc
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-muted-foreground"
                                )}
                            >
                                <span className="text-2xl">
                                    {loc === "vi" ? "🇻🇳" : "🇺🇸"}
                                </span>
                                <span className="font-medium">{languageNames[loc]}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="w-5 h-5" />
                        {t("settings.appearance")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div>
                        <label className="block text-sm font-medium mb-3">{t("settings.theme")}</label>
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
                        {t("settings.notifications")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t("settings.pushNotifications")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.pushNotificationsDesc")}
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
                        {t("settings.dataStorage")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t("settings.offlineStorage")}</p>
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
                            <p className="font-medium">{t("settings.clearCache")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.clearCacheDesc")}
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
                        {t("settings.security")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t("settings.changePassword")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.changePasswordDesc")}
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
                        {t("settings.dangerZone")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t("settings.deleteAccount")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.deleteAccountDesc")}
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
