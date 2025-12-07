import { db, addToSyncQueue, type SyncQueue } from "./db";
import { api, type Course, type Lesson } from "./api";

// ============================================
// Sync Status Types
// ============================================
export type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

export interface SyncState {
    status: SyncStatus;
    lastSyncAt: Date | null;
    pendingChanges: number;
    error: string | null;
}

// ============================================
// Sync Service Class
// ============================================
class SyncService {
    private static instance: SyncService;
    private syncInProgress = false;
    private listeners: Set<(state: SyncState) => void> = new Set();
    private state: SyncState = {
        status: "idle",
        lastSyncAt: null,
        pendingChanges: 0,
        error: null,
    };

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    // Subscribe to state changes
    subscribe(callback: (state: SyncState) => void): () => void {
        this.listeners.add(callback);
        callback(this.state);
        return () => this.listeners.delete(callback);
    }

    private updateState(updates: Partial<SyncState>) {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach((cb) => cb(this.state));
    }

    // Check if online
    isOnline(): boolean {
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    }

    // ============================================
    // Pull Data from Server
    // ============================================
    async pullFromServer(): Promise<void> {
        if (!this.isOnline()) {
            this.updateState({ status: "offline" });
            return;
        }

        if (this.syncInProgress) return;
        this.syncInProgress = true;
        this.updateState({ status: "syncing", error: null });

        try {
            // Pull courses
            const coursesData = await api.getCourses({ limit: 100 });
            await db.transaction("rw", db.courses, async () => {
                for (const course of coursesData.courses) {
                    const localCourse = this.mapApiCourseToLocal(course);
                    await db.courses.put(localCourse);
                }
            });

            // Pull lessons for each course
            for (const course of coursesData.courses) {
                try {
                    const lessonsData = await api.getCourseLessons(course.id);
                    await db.transaction("rw", db.lessons, async () => {
                        for (const lesson of lessonsData.lessons) {
                            const localLesson = this.mapApiLessonToLocal(lesson);
                            await db.lessons.put(localLesson);
                        }
                    });
                } catch {
                    console.warn(`Failed to sync lessons for course ${course.id}`);
                }
            }

            this.updateState({
                status: "success",
                lastSyncAt: new Date(),
            });
        } catch (error) {
            this.updateState({
                status: "error",
                error: error instanceof Error ? error.message : "Sync failed",
            });
        } finally {
            this.syncInProgress = false;
        }
    }

    // ============================================
    // Push Local Changes to Server
    // ============================================
    async pushToServer(): Promise<void> {
        if (!this.isOnline()) {
            this.updateState({ status: "offline" });
            return;
        }

        const pendingItems = await db.syncQueue.toArray();
        if (pendingItems.length === 0) {
            this.updateState({ pendingChanges: 0 });
            return;
        }

        this.updateState({ status: "syncing", pendingChanges: pendingItems.length });

        for (const item of pendingItems) {
            try {
                await this.processSyncItem(item);
                await db.syncQueue.delete(item.id!);
            } catch (error) {
                console.error("Sync item failed:", item, error);

                // Increment retry count, remove after 5 retries
                if (item.retryCount >= 5) {
                    await db.syncQueue.delete(item.id!);
                } else {
                    await db.syncQueue.update(item.id!, {
                        retryCount: item.retryCount + 1,
                    });
                }
            }
        }

        const remaining = await db.syncQueue.count();
        this.updateState({ pendingChanges: remaining });
    }

    private async processSyncItem(item: SyncQueue): Promise<void> {
        const { operation, table, data } = item;

        switch (table) {
            case "userProgress":
                await this.syncUserProgress(operation, data);
                break;
            // Add more tables as needed
            default:
                console.warn(`Unknown table for sync: ${table}`);
        }
    }

    private async syncUserProgress(operation: string, data: Record<string, unknown>): Promise<void> {
        // For user progress, we typically just update
        if (operation === "update" || operation === "create") {
            await api.updateLessonProgress(data.lessonId as string, {
                completed: data.completed as boolean,
                time_spent: data.timeSpent as number,
            });
        }
    }

    // ============================================
    // Full Sync (Pull + Push)
    // ============================================
    async fullSync(): Promise<void> {
        await this.pushToServer();
        await this.pullFromServer();
    }

    // ============================================
    // Offline-First Data Access
    // ============================================
    async getCourse(courseId: string): Promise<Course | null> {
        // Try local first
        const localCourse = await db.courses.get(courseId);

        if (this.isOnline()) {
            try {
                const apiData = await api.getCourse(courseId);
                // Update local cache
                await db.courses.put(this.mapApiCourseToLocal(apiData.course));
                return apiData.course;
            } catch {
                // Fall back to local
                return localCourse ? this.mapLocalCourseToApi(localCourse) : null;
            }
        }

        return localCourse ? this.mapLocalCourseToApi(localCourse) : null;
    }

    async getLessons(courseId: string): Promise<Lesson[]> {
        const localLessons = await db.lessons.where("courseId").equals(courseId).sortBy("order");

        if (this.isOnline()) {
            try {
                const apiData = await api.getCourseLessons(courseId);
                // Update local cache
                await db.transaction("rw", db.lessons, async () => {
                    for (const lesson of apiData.lessons) {
                        await db.lessons.put(this.mapApiLessonToLocal(lesson));
                    }
                });
                return apiData.lessons;
            } catch {
                return localLessons.map((l) => this.mapLocalLessonToApi(l));
            }
        }

        return localLessons.map((l) => this.mapLocalLessonToApi(l));
    }

    // ============================================
    // Save Progress Offline-First
    // ============================================
    async saveProgress(lessonId: string, courseId: string, userId: string, progress: { completed: boolean; timeSpent: number }): Promise<void> {
        const now = new Date();

        // Save locally first
        await db.userProgress.put({
            id: `${userId}_${lessonId}`,
            lessonId,
            courseId,
            userId,
            completed: progress.completed,
            progress: progress.completed ? 100 : 0,
            timeSpent: progress.timeSpent,
            lastAccessedAt: now,
            syncedAt: this.isOnline() ? now : undefined,
        });

        // Queue for sync if online fails
        if (this.isOnline()) {
            try {
                await api.updateLessonProgress(lessonId, {
                    completed: progress.completed,
                    time_spent: progress.timeSpent,
                });
            } catch {
                await addToSyncQueue("update", "userProgress", {
                    lessonId,
                    courseId,
                    completed: progress.completed,
                    timeSpent: progress.timeSpent,
                });
            }
        } else {
            await addToSyncQueue("update", "userProgress", {
                lessonId,
                courseId,
                completed: progress.completed,
                timeSpent: progress.timeSpent,
            });
        }

        // Update pending count
        const pending = await db.syncQueue.count();
        this.updateState({ pendingChanges: pending });
    }

    // ============================================
    // Type Mapping Helpers
    // ============================================
    private mapApiCourseToLocal(course: Course): import("./db").Course {
        return {
            id: course.id,
            title: course.title,
            description: course.description || "",
            thumbnail: course.thumbnail,
            instructorId: "",
            instructorName: course.instructor_name || "",
            category: course.category || "",
            tags: course.tags || [],
            duration: course.duration || 0,
            enrolledCount: course.enrolled_count || 0,
            rating: course.rating || 0,
            createdAt: new Date(course.created_at),
            updatedAt: new Date(course.updated_at),
            syncedAt: new Date(),
        };
    }

    private mapLocalCourseToApi(course: import("./db").Course): Course {
        return {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            instructor_name: course.instructorName,
            category: course.category,
            tags: course.tags,
            duration: course.duration,
            enrolled_count: course.enrolledCount,
            rating: course.rating,
            published: true,
            created_at: course.createdAt.toISOString(),
            updated_at: course.updatedAt.toISOString(),
        };
    }

    private mapApiLessonToLocal(lesson: Lesson): import("./db").Lesson {
        return {
            id: lesson.id,
            courseId: lesson.course_id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content || "",
            videoUrl: lesson.video_url,
            duration: lesson.duration || 0,
            order: lesson.order || 0,
            type: (lesson.type || "text") as "video" | "text" | "quiz" | "assignment",
            createdAt: new Date(lesson.created_at),
            updatedAt: new Date(lesson.updated_at),
            syncedAt: new Date(),
        };
    }

    private mapLocalLessonToApi(lesson: import("./db").Lesson): Lesson {
        return {
            id: lesson.id,
            course_id: lesson.courseId,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            video_url: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order,
            type: lesson.type,
            created_at: lesson.createdAt.toISOString(),
            updated_at: lesson.updatedAt.toISOString(),
        } as Lesson;
    }
}

// ============================================
// Export Singleton
// ============================================
export const syncService = SyncService.getInstance();

// ============================================
// Auto-Sync on Network Change
// ============================================
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        console.log("🌐 Back online - starting sync");
        syncService.fullSync();
    });

    window.addEventListener("offline", () => {
        console.log("📴 Went offline");
    });
}
