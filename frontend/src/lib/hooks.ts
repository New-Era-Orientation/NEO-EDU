"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api, setCSRFToken, clearCSRFToken, type Course, type Lesson, type User } from "./api";
import { useAuthStore } from "@/stores";

// ============================================
// Auth Hooks
// ============================================
export function useAuth() {
    const { user, token, isAuthenticated, login, logout, setLoading, setUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Check auth status on mount (using cookies)
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const result = await api.checkAuthStatus();
                if (result.authenticated && result.user) {
                    setUser(result.user);
                    if (result.csrfToken) {
                        setCSRFToken(result.csrfToken);
                    }
                } else {
                    logout();
                }
            } catch {
                // Auth check failed, user not authenticated
                logout();
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, [setUser, logout, setLoading]);

    const loginMutation = useMutation({
        mutationFn: (data: { email: string; password: string }) => api.login(data),
        onSuccess: (data) => {
            login(data.user, data.token);
            if (data.csrfToken) {
                setCSRFToken(data.csrfToken);
            }
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });

    const registerMutation = useMutation({
        mutationFn: (data: {
            email: string;
            password: string;
            name: string;
            role?: "student" | "instructor";
        }) => api.register(data),
        onSuccess: (data) => {
            login(data.user, data.token);
            if (data.csrfToken) {
                setCSRFToken(data.csrfToken);
            }
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: () => {
            logout();
            clearCSRFToken();
            queryClient.clear();
        },
    });

    const { data: currentUser, isLoading } = useQuery({
        queryKey: ["user", "me"],
        queryFn: () => api.getMe(),
        enabled: !!token || isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    // Role check helpers
    const isAdmin = user?.role === "admin";
    const isInstructor = user?.role === "instructor" || user?.role === "admin";
    const isStudent = user?.role === "student";

    const hasRole = (roles: string | string[]) => {
        if (!user?.role) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };

    const hasMinLevel = (minLevel: "student" | "instructor" | "admin") => {
        if (!user?.role) return false;
        const levelOrder = { student: 1, instructor: 2, admin: 3 };
        const userLevel = levelOrder[user.role as keyof typeof levelOrder] || 0;
        const requiredLevel = levelOrder[minLevel];
        return userLevel >= requiredLevel;
    };

    return {
        user: currentUser?.user || user,
        token,
        isAuthenticated,
        isLoading,
        isAdmin,
        isInstructor,
        isStudent,
        hasRole,
        hasMinLevel,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        loginError: loginMutation.error,
        registerError: registerMutation.error,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
    };
}

// ============================================
// Courses Hooks
// ============================================
export function useCourses(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ["courses", params],
        queryFn: () => api.getCourses(params),
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useCourse(id: string) {
    return useQuery({
        queryKey: ["course", id],
        queryFn: () => api.getCourse(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useSearchCourses(query: string, limit?: number) {
    return useQuery({
        queryKey: ["courses", "search", query, limit],
        queryFn: () => api.searchCourses(query, limit),
        enabled: query.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useEnrollCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (courseId: string) => api.enrollCourse(courseId),
        onSuccess: (_, courseId) => {
            queryClient.invalidateQueries({ queryKey: ["course", courseId] });
            queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });
        },
    });
}

export function useCreateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description: string;
            category: string;
            tags?: string[];
            thumbnail?: string;
            published?: boolean;
        }) => api.createCourse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
}

export function useUpdateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<{
                title: string;
                description: string;
                category: string;
                tags: string[];
                thumbnail: string;
                published: boolean;
            }>;
        }) => api.updateCourse(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["course", id] });
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
}

export function useDeleteCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteCourse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
}

// ============================================
// Lessons Hooks
// ============================================
export function useLesson(id: string) {
    return useQuery({
        queryKey: ["lesson", id],
        queryFn: () => api.getLesson(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useMarkLessonComplete() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, progress }: { id: string; progress: number }) =>
            api.markLessonComplete(id, progress),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["lesson", id] });
            queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });
        },
    });
}

// ============================================
// User Hooks
// ============================================
export function useProfile() {
    const { token, isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ["user", "profile"],
        queryFn: () => api.getProfile(),
        enabled: !!token || isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name?: string; avatar?: string; bio?: string }) =>
            api.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
}

export function useEnrolledCourses() {
    const { token, isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ["enrolledCourses"],
        queryFn: () => api.getEnrolledCourses(),
        enabled: !!token || isAuthenticated,
        staleTime: 60 * 1000, // 1 minute
    });
}

// ============================================
// Health Check Hook
// ============================================
export function useHealthCheck() {
    return useQuery({
        queryKey: ["health"],
        queryFn: () => api.healthCheck(),
        staleTime: 30 * 1000, // 30 seconds
        retry: false,
    });
}

// ============================================
// Role-Based Access Hook
// ============================================
export function useRequireAuth(requiredRole?: "student" | "instructor" | "admin") {
    const { isAuthenticated, user, isLoading, hasMinLevel } = useAuth();

    const authorized = !requiredRole || hasMinLevel(requiredRole);

    return {
        isLoading,
        isAuthenticated,
        authorized: isAuthenticated && authorized,
        user,
    };
}
