import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// Auth Store
// ============================================
interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: "student" | "instructor" | "admin";
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),
            login: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: "neo-edu-auth",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);

// ============================================
// UI Store
// ============================================
interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    theme: "light" | "dark" | "system";
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebarCollapse: () => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: false,
            sidebarCollapsed: false,
            theme: "system",
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: "neo-edu-ui",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ============================================
// Offline Store
// ============================================
interface OfflineState {
    isOnline: boolean;
    pendingSync: number;
    lastSyncTime: Date | null;
    setOnline: (online: boolean) => void;
    addPendingSync: () => void;
    removePendingSync: () => void;
    setLastSyncTime: (time: Date) => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingSync: 0,
    lastSyncTime: null,
    setOnline: (isOnline) => set({ isOnline }),
    addPendingSync: () => set((state) => ({ pendingSync: state.pendingSync + 1 })),
    removePendingSync: () => set((state) => ({ pendingSync: Math.max(0, state.pendingSync - 1) })),
    setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
}));

// ============================================
// Course Progress Store
// ============================================
interface LessonProgress {
    lessonId: string;
    completed: boolean;
    progress: number; // 0-100
    lastAccessedAt: Date;
}

interface CourseProgressState {
    progress: Record<string, LessonProgress[]>;
    setLessonProgress: (courseId: string, lessonProgress: LessonProgress) => void;
    getLessonProgress: (courseId: string, lessonId: string) => LessonProgress | undefined;
    getCourseProgress: (courseId: string) => number;
}

export const useCourseProgressStore = create<CourseProgressState>()(
    persist(
        (set, get) => ({
            progress: {},
            setLessonProgress: (courseId, lessonProgress) =>
                set((state) => {
                    const courseProgress = state.progress[courseId] || [];
                    const existingIndex = courseProgress.findIndex(
                        (p) => p.lessonId === lessonProgress.lessonId
                    );

                    if (existingIndex >= 0) {
                        courseProgress[existingIndex] = lessonProgress;
                    } else {
                        courseProgress.push(lessonProgress);
                    }

                    return {
                        progress: {
                            ...state.progress,
                            [courseId]: courseProgress,
                        },
                    };
                }),
            getLessonProgress: (courseId, lessonId) => {
                const courseProgress = get().progress[courseId] || [];
                return courseProgress.find((p) => p.lessonId === lessonId);
            },
            getCourseProgress: (courseId) => {
                const courseProgress = get().progress[courseId] || [];
                if (courseProgress.length === 0) return 0;
                const completed = courseProgress.filter((p) => p.completed).length;
                return Math.round((completed / courseProgress.length) * 100);
            },
        }),
        {
            name: "neo-edu-progress",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
