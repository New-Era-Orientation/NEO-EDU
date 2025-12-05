import { useAuthStore } from "@/stores";

// ============================================
// API Configuration
// ============================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ============================================
// Types
// ============================================
export interface ApiError {
    error: string;
    details?: unknown;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: "student" | "instructor" | "admin";
    avatar?: string;
    createdAt?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
    csrfToken: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    thumbnail?: string;
    duration: number;
    enrolled_count: number;
    rating: number;
    instructor_name: string;
    instructor_avatar?: string;
    instructor_bio?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    lessons?: Lesson[];
    lesson_count?: number;
}

export interface Lesson {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    duration: number;
    order: number;
    type: "video" | "text" | "quiz" | "assignment";
    created_at: string;
    updated_at: string;
}

// ============================================
// CSRF Token Management
// ============================================
let csrfToken: string | null = null;

export function setCSRFToken(token: string) {
    csrfToken = token;
    // Also store in cookie for persistence
    if (typeof document !== "undefined") {
        document.cookie = `csrf_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
}

export function getCSRFToken(): string | null {
    if (csrfToken) return csrfToken;

    // Try to get from cookie
    if (typeof document !== "undefined") {
        const match = document.cookie.match(/csrf_token=([^;]+)/);
        if (match) {
            csrfToken = match[1];
            return csrfToken;
        }
    }

    return null;
}

export function clearCSRFToken() {
    csrfToken = null;
    if (typeof document !== "undefined") {
        document.cookie = "csrf_token=; path=/; max-age=0";
    }
}

// ============================================
// API Client
// ============================================
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getHeaders(includeCSRF: boolean = false): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        // Get token from store for Authorization header (fallback for non-cookie auth)
        const token = useAuthStore.getState().token;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        if (includeCSRF) {
            const csrf = getCSRFToken();
            if (csrf) {
                headers["X-CSRF-Token"] = csrf;
            }
        }

        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
            options.method || "GET"
        );

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(isStateChanging),
                ...options.headers,
            },
            credentials: "include", // Always include cookies
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                // Clear auth state on unauthorized
                useAuthStore.getState().logout();
                clearCSRFToken();
            }
            throw new Error(data.error || "An error occurred");
        }

        return data;
    }

    // ============================================
    // Auth Endpoints
    // ============================================
    async register(data: {
        email: string;
        password: string;
        name: string;
        role?: "student" | "instructor";
    }): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        });

        // Store CSRF token
        if (response.csrfToken) {
            setCSRFToken(response.csrfToken);
        }

        return response;
    }

    async login(data: { email: string; password: string }): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        });

        // Store CSRF token
        if (response.csrfToken) {
            setCSRFToken(response.csrfToken);
        }

        return response;
    }

    async logout(): Promise<{ message: string }> {
        const result = await this.request<{ message: string }>("/auth/logout", {
            method: "POST",
        });

        // Clear CSRF token
        clearCSRFToken();

        return result;
    }

    async getMe(): Promise<{ user: User }> {
        return this.request<{ user: User }>("/auth/me");
    }

    async checkAuthStatus(): Promise<{
        authenticated: boolean;
        user?: User;
        csrfToken?: string;
    }> {
        const result = await this.request<{
            authenticated: boolean;
            user?: User;
            csrfToken?: string;
        }>("/auth/status");

        // Update CSRF token if provided
        if (result.csrfToken) {
            setCSRFToken(result.csrfToken);
        }

        return result;
    }

    async refreshToken(): Promise<{ token: string; csrfToken: string }> {
        const response = await this.request<{ token: string; csrfToken: string }>(
            "/auth/refresh",
            { method: "POST" }
        );

        if (response.csrfToken) {
            setCSRFToken(response.csrfToken);
        }

        return response;
    }

    // ============================================
    // Courses Endpoints
    // ============================================
    async getCourses(params?: {
        category?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ courses: Course[] }> {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set("category", params.category);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{ courses: Course[] }>(
            `/courses${query ? `?${query}` : ""}`
        );
    }

    async searchCourses(q: string, limit?: number): Promise<{ courses: Course[] }> {
        const searchParams = new URLSearchParams({ q });
        if (limit) searchParams.set("limit", limit.toString());

        return this.request<{ courses: Course[] }>(
            `/courses/search?${searchParams.toString()}`
        );
    }

    async getCourse(id: string): Promise<{ course: Course }> {
        return this.request<{ course: Course }>(`/courses/${id}`);
    }

    async createCourse(data: {
        title: string;
        description: string;
        category: string;
        tags?: string[];
        thumbnail?: string;
        published?: boolean;
    }): Promise<{ course: Course }> {
        return this.request<{ course: Course }>("/courses", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateCourse(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            category: string;
            tags: string[];
            thumbnail: string;
            published: boolean;
        }>
    ): Promise<{ course: Course }> {
        return this.request<{ course: Course }>(`/courses/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteCourse(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/courses/${id}`, {
            method: "DELETE",
        });
    }

    async enrollCourse(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/courses/${id}/enroll`, {
            method: "POST",
        });
    }

    // ============================================
    // Lessons Endpoints
    // ============================================
    async getLesson(id: string): Promise<{ lesson: Lesson }> {
        return this.request<{ lesson: Lesson }>(`/lessons/${id}`);
    }

    async createLesson(data: {
        courseId: string;
        title: string;
        description?: string;
        content?: string;
        videoUrl?: string;
        duration: number;
        order: number;
        type: Lesson["type"];
    }): Promise<{ lesson: Lesson }> {
        return this.request<{ lesson: Lesson }>("/lessons", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateLesson(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            content: string;
            videoUrl: string;
            duration: number;
            order: number;
            type: Lesson["type"];
        }>
    ): Promise<{ lesson: Lesson }> {
        return this.request<{ lesson: Lesson }>(`/lessons/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteLesson(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/lessons/${id}`, {
            method: "DELETE",
        });
    }

    async markLessonComplete(
        id: string,
        progress: number
    ): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/lessons/${id}/progress`, {
            method: "POST",
            body: JSON.stringify({ progress, completed: progress >= 100 }),
        });
    }

    // ============================================
    // Users Endpoints
    // ============================================
    async getProfile(): Promise<{ user: User }> {
        return this.request<{ user: User }>("/users/profile");
    }

    async updateProfile(data: {
        name?: string;
        avatar?: string;
        bio?: string;
    }): Promise<{ user: User }> {
        return this.request<{ user: User }>("/users/profile", {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async getEnrolledCourses(): Promise<{ courses: Course[] }> {
        return this.request<{ courses: Course[] }>("/users/courses");
    }

    // ============================================
    // Health Check
    // ============================================
    async healthCheck(): Promise<{
        status: string;
        timestamp: string;
        services: { database: string; redis: string };
    }> {
        return this.request("/health");
    }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export for testing or custom instances
export { ApiClient };
