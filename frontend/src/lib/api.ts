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

export interface UserPreferences {
    language: "vi" | "en";
    theme: "light" | "dark" | "system";
    notifications: boolean;
}

export interface ContestQuestion {
    id: string;
    question: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
    points: number;
}

export interface Contest {
    id: string;
    title: string;
    description?: string;
    questions: ContestQuestion[];
    passing_score: number;
    time_limit: number;
    start_time: string;
    end_time: string;
    max_participants?: number;
    is_public: boolean;
    status: "draft" | "upcoming" | "active" | "ended";
    created_by: string;
    creator_name?: string;
    created_at: string;
    updated_at: string;
    participant_count?: number;
    question_count?: number;
}

export interface ContestLeaderboardEntry {
    user_id: string;
    name: string;
    avatar?: string;
    score: number;
    rank: number;
    submitted_at: string;
}

export interface Wiki {
    id: string;
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    is_published: boolean;
    author_id: string;
    author_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ExamQuestion {
    id?: string;
    exam_id?: string;
    question_text: string;
    question_type: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correct_answer: string;
    points: number;
    order: number;
    explanation?: string;
}

export interface Exam {
    id: string;
    title: string;
    description?: string;
    course_id?: string;
    course_title?: string;
    duration_minutes: number;
    passing_score: number;
    max_attempts: number;
    shuffle_questions: boolean;
    is_published: boolean;
    created_by: string;
    creator_name?: string;
    question_count?: number;
    submission_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ExamSubmission {
    id: string;
    exam_id: string;
    user_id: string;
    answers: Record<string, string>;
    score?: number;
    total_points?: number;
    passed?: boolean;
    started_at: string;
    submitted_at?: string;
    exam_title?: string;
    passing_score?: number;
}

export interface SystemSetting {
    key: string;
    value: string | number | boolean;
    description?: string;
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

    async getManagedCourses(params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        courses: Course[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        return this.request("/courses/manage?" + searchParams.toString());
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

    async getCourseLessons(courseId: string): Promise<{ lessons: Lesson[] }> {
        return this.request<{ lessons: Lesson[] }>(`/courses/${courseId}/lessons`);
    }

    async updateLessonProgress(lessonId: string, data: { completed: boolean; time_spent: number }): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/lessons/${lessonId}/progress`, {
            method: "POST",
            body: JSON.stringify(data),
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

    async getPreferences(): Promise<{ preferences: UserPreferences }> {
        return this.request<{ preferences: UserPreferences }>("/users/preferences");
    }

    async updatePreferences(data: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
        return this.request<{ preferences: UserPreferences }>("/users/preferences", {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    // ============================================
    // Admin Endpoints
    // ============================================
    async getUsers(params?: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
    }): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());
        if (params?.role) searchParams.set("role", params.role);
        if (params?.search) searchParams.set("search", params.search);

        return this.request("/users?" + searchParams.toString());
    }

    async createUser(data: {
        email: string;
        password: string;
        name: string;
        role: string;
        must_change_password?: boolean;
    }): Promise<{ user: User }> {
        return this.request("/users", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateUser(
        id: string,
        data: Partial<{
            name: string;
            role: string;
            email: string;
            password: string;
            bio: string;
            must_change_password: boolean;
        }>
    ): Promise<{ user: User }> {
        return this.request(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/users/${id}`, {
            method: "DELETE",
        });
    }

    // ============================================
    // Contest Endpoints
    // ============================================
    async getContests(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        contests: Contest[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        return this.request("/contests?" + searchParams.toString());
    }

    async getAdminContests(params?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        contests: Contest[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        return this.request("/contests/admin/all?" + searchParams.toString());
    }

    async getContest(id: string): Promise<{ contest: Contest }> {
        return this.request<{ contest: Contest }>(`/contests/${id}`);
    }

    async createContest(data: Partial<Contest>): Promise<{ contest: Contest }> {
        return this.request<{ contest: Contest }>("/contests", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateContest(id: string, data: Partial<Contest>): Promise<{ contest: Contest }> {
        return this.request<{ contest: Contest }>(`/contests/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteContest(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/contests/${id}`, {
            method: "DELETE",
        });
    }

    async getContestLeaderboard(id: string): Promise<{ leaderboard: ContestLeaderboardEntry[] }> {
        return this.request<{ leaderboard: ContestLeaderboardEntry[] }>(`/contests/${id}/leaderboard`);
    }

    async registerForContest(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/contests/${id}/register`, {
            method: "POST",
        });
    }

    async startContest(id: string): Promise<{
        message: string;
        questions: ContestQuestion[];
        time_limit: number
    }> {
        return this.request(`/contests/${id}/start`, {
            method: "POST",
        });
    }

    async submitContest(id: string, answers: Record<string, string | string[]>): Promise<{
        message: string;
        score: number;
        rank: number;
        contestId: string;
        userId: string;
        userName: string;
    }> {
        return this.request(`/contests/${id}/submit`, {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
    }

    // ============================================
    // Wiki Endpoints
    // ============================================
    async getWikis(params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ wikis: Wiki[] }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{ wikis: Wiki[] }>(
            `/wiki${query ? `?${query}` : ""}`
        );
    }

    async getAdminWikis(params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        wikis: Wiki[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        return this.request("/wiki/admin?" + searchParams.toString());
    }

    async getWiki(slug: string): Promise<{ wiki: Wiki }> {
        return this.request<{ wiki: Wiki }>(`/wiki/${slug}`);
    }

    async getWikiById(id: string): Promise<{ wiki: Wiki }> {
        return this.request<{ wiki: Wiki }>(`/wiki/admin/${id}`);
    }

    async createWiki(data: {
        title: string;
        slug: string;
        content?: string;
        excerpt?: string;
        is_published?: boolean;
    }): Promise<{ wiki: Wiki }> {
        return this.request<{ wiki: Wiki }>("/wiki", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateWiki(
        id: string,
        data: Partial<{
            title: string;
            slug: string;
            content: string;
            excerpt: string;
            is_published: boolean;
        }>
    ): Promise<{ wiki: Wiki }> {
        return this.request<{ wiki: Wiki }>(`/wiki/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteWiki(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/wiki/${id}`, {
            method: "DELETE",
        });
    }

    // ============================================
    // Exam Endpoints
    // ============================================
    async getExams(params?: {
        course_id?: string;
        page?: number;
        limit?: number;
    }): Promise<{ exams: Exam[] }> {
        const searchParams = new URLSearchParams();
        if (params?.course_id) searchParams.set("course_id", params.course_id);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{ exams: Exam[] }>(
            `/exams${query ? `?${query}` : ""}`
        );
    }

    async getAdminExams(params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        exams: Exam[];
        total: number;
        page: number;
        limit: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.page) searchParams.set("page", params.page.toString());
        if (params?.limit) searchParams.set("limit", params.limit.toString());

        return this.request("/exams/admin?" + searchParams.toString());
    }

    async getExam(id: string): Promise<{ exam: Exam }> {
        return this.request<{ exam: Exam }>(`/exams/${id}`);
    }

    async getExamWithQuestions(id: string): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
        return this.request<{ exam: Exam; questions: ExamQuestion[] }>(`/exams/admin/${id}`);
    }

    async createExam(data: {
        title: string;
        description?: string;
        course_id?: string | null;
        duration_minutes?: number;
        passing_score?: number;
        max_attempts?: number;
        shuffle_questions?: boolean;
        is_published?: boolean;
        questions?: ExamQuestion[];
    }): Promise<{ exam: Exam }> {
        return this.request<{ exam: Exam }>("/exams", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateExam(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            course_id: string | null;
            duration_minutes: number;
            passing_score: number;
            max_attempts: number;
            shuffle_questions: boolean;
            is_published: boolean;
            questions: ExamQuestion[];
        }>
    ): Promise<{ exam: Exam }> {
        return this.request<{ exam: Exam }>(`/exams/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteExam(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/exams/${id}`, {
            method: "DELETE",
        });
    }

    async getExamQuestions(id: string): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
        return this.request<{ exam: Exam; questions: ExamQuestion[] }>(`/exams/${id}/questions`);
    }

    async startExam(id: string): Promise<{ message: string; submission: ExamSubmission }> {
        return this.request<{ message: string; submission: ExamSubmission }>(`/exams/${id}/start`, {
            method: "POST",
        });
    }

    async submitExam(id: string, answers: Record<string, string>): Promise<{
        message: string;
        submission: ExamSubmission;
        score: number;
        passed: boolean;
        earnedPoints: number;
        totalPoints: number;
    }> {
        return this.request(`/exams/${id}/submit`, {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
    }

    async getExamResult(id: string): Promise<{ result: ExamSubmission }> {
        return this.request<{ result: ExamSubmission }>(`/exams/${id}/result`);
    }

    // ============================================
    // System Settings Endpoints (Admin)
    // ============================================
    async getSettings(): Promise<{ settings: SystemSetting[] }> {
        return this.request<{ settings: SystemSetting[] }>("/settings");
    }

    async getSetting(key: string): Promise<{ setting: SystemSetting }> {
        return this.request<{ setting: SystemSetting }>(`/settings/${key}`);
    }

    async updateSetting(key: string, value: string | number | boolean): Promise<{ message: string; setting: { key: string; value: unknown } }> {
        return this.request(`/settings/${key}`, {
            method: "PUT",
            body: JSON.stringify({ value }),
        });
    }

    async updateSettings(settings: Record<string, string | number | boolean>): Promise<{ message: string; count: number }> {
        return this.request("/settings", {
            method: "PUT",
            body: JSON.stringify({ settings }),
        });
    }

    async testEmailConfig(to: string): Promise<{ message: string }> {
        return this.request("/settings/email/test", {
            method: "POST",
            body: JSON.stringify({ to }),
        });
    }

    // ============================================
    // Analytics Endpoints (Admin)
    // ============================================
    async getAnalyticsDashboard(): Promise<{
        stats: {
            totalUsers: number;
            totalCourses: number;
            totalLessons: number;
            totalExams: number;
            totalEnrollments: number;
            activeUsers7d: number;
            newUsers7d: number;
            examCompletions7d: number;
        }
    }> {
        return this.request("/analytics/dashboard");
    }

    async getAnalyticsUserTrend(): Promise<{ data: Array<{ date: string; count: number }> }> {
        return this.request("/analytics/users/trend");
    }

    async getAnalyticsEnrollmentTrend(): Promise<{ data: Array<{ date: string; count: number }> }> {
        return this.request("/analytics/enrollments/trend");
    }

    async getAnalyticsTopCourses(): Promise<{
        courses: Array<{
            id: string;
            title: string;
            enrolled_count: number;
            average_rating: number;
        }>
    }> {
        return this.request("/analytics/courses/top");
    }

    async getAnalyticsExamPerformance(): Promise<{
        exams: Array<{
            id: string;
            title: string;
            attempts: number;
            avg_score: string;
            passed: number;
            failed: number;
            pass_rate: string;
        }>
    }> {
        return this.request("/analytics/exams/performance");
    }

    async getAnalyticsActivity(): Promise<{
        activities: Array<{
            type: string;
            user_name: string;
            target: string;
            created_at: string;
        }>
    }> {
        return this.request("/analytics/activity");
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
