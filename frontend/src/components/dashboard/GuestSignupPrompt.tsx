"use client";

import { useState } from "react";
import Link from "next/link";
import { X, UserPlus, Gift, Star } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

interface GuestSignupPromptProps {
    variant?: "banner" | "modal" | "inline";
    title?: string;
    message?: string;
    onClose?: () => void;
}

export function GuestSignupPrompt({
    variant = "banner",
    title = "Tạo tài khoản miễn phí!",
    message = "Đăng ký để lưu tiến độ học tập và truy cập nhiều tính năng hơn.",
    onClose,
}: GuestSignupPromptProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        setIsVisible(false);
        onClose?.();
    };

    if (!isVisible) return null;

    if (variant === "modal") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-md animate-fade-in">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">🎉 Chúc mừng!</h2>
                        <p className="text-muted-foreground mb-6">
                            Bạn đã hoàn thành khóa học! Tạo tài khoản để lưu tiến độ và nhận chứng chỉ.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link href="/signup">
                                <Button className="w-full" size="lg">
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Tạo tài khoản miễn phí
                                </Button>
                            </Link>
                            <Button variant="ghost" onClick={handleClose}>
                                Để sau
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                        <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                    <Link href="/signup">
                        <Button size="sm">
                            Đăng ký
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    // Banner variant (default)
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-white/80">{message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/signup">
                        <Button variant="outline" className="bg-white text-primary hover:bg-white/90 border-0">
                            Đăng ký ngay
                        </Button>
                    </Link>
                    <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook to check if user is guest
export function useIsGuest() {
    const storedAuth = typeof window !== "undefined" ? localStorage.getItem("neo-edu-auth") : null;
    if (!storedAuth) return true;

    try {
        const parsed = JSON.parse(storedAuth);
        return !parsed?.state?.token;
    } catch {
        return true;
    }
}
