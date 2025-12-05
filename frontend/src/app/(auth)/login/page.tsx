"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/hooks";

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoggingIn, loginError } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            await login({ email, password });
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-2 text-muted-foreground">
                    Sign in to continue your learning journey
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {(error || loginError) && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        {error || (loginError instanceof Error ? loginError.message : "An error occurred")}
                    </div>
                )}

                {/* Email */}
                <Input
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    autoComplete="email"
                    required
                />

                {/* Password */}
                <Input
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    }
                    autoComplete="current-password"
                    required
                />

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoggingIn}
                >
                    Sign In
                </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">
                        Don&apos;t have an account?
                    </span>
                </div>
            </div>

            {/* Sign Up Link */}
            <Link href="/signup">
                <Button variant="outline" className="w-full" size="lg">
                    Create Account
                </Button>
            </Link>

            {/* Back to Home */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                    ← Back to home
                </Link>
            </p>
        </div>
    );
}
