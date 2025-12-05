"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, GraduationCap, BookOpen } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Role = "student" | "instructor";

export default function SignupPage() {
    const router = useRouter();
    const { register, isRegistering, registerError } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<Role>("student");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await register({ name, email, password, role });
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-2 text-muted-foreground">
                    Join NEO EDU and start learning today
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {(error || registerError) && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        {error || (registerError instanceof Error ? registerError.message : "An error occurred")}
                    </div>
                )}

                {/* Role Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                        I want to
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                role === "student"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                role === "student" ? "gradient-primary text-white" : "bg-muted"
                            )}>
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Learn</p>
                                <p className="text-xs text-muted-foreground">As a student</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRole("instructor")}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                role === "instructor"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                role === "instructor" ? "gradient-primary text-white" : "bg-muted"
                            )}>
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Teach</p>
                                <p className="text-xs text-muted-foreground">As an instructor</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Name */}
                <Input
                    type="text"
                    label="Full name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User className="w-4 h-4" />}
                    autoComplete="name"
                    required
                />

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
                    placeholder="At least 8 characters"
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
                    autoComplete="new-password"
                    required
                />

                {/* Confirm Password */}
                <Input
                    type={showPassword ? "text" : "password"}
                    label="Confirm password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    autoComplete="new-password"
                    required
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isRegistering}
                >
                    Create Account
                </Button>

                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">
                        Already have an account?
                    </span>
                </div>
            </div>

            {/* Sign In Link */}
            <Link href="/login">
                <Button variant="outline" className="w-full" size="lg">
                    Sign In
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
