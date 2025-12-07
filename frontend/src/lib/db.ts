import Dexie, { type Table } from "dexie";

// ============================================
// Database Schema Types
// ============================================
export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    instructorId: string;
    instructorName: string;
    category: string;
    tags: string[];
    duration: number; // in minutes
    enrolledCount: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
}

export interface Lesson {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    content: string; // HTML content from TipTap
    videoUrl?: string;
    duration: number;
    order: number;
    type: "video" | "text" | "quiz" | "assignment";
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
}

export interface Quiz {
    id: string;
    lessonId: string;
    questions: QuizQuestion[];
    passingScore: number;
    timeLimit?: number; // in minutes
    createdAt: Date;
    updatedAt: Date;
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
    points: number;
}

export interface UserProgress {
    id: string;
    lessonId: string;
    courseId: string;
    userId: string;
    completed: boolean;
    progress: number; // 0-100
    timeSpent: number; // in seconds
    lastAccessedAt: Date;
    syncedAt?: Date;
}

export interface CachedFile {
    id: string;
    url: string;
    blob: Blob;
    mimeType: string;
    size: number;
    cachedAt: Date;
    expiresAt?: Date;
}

export interface SyncQueue {
    id?: number;
    operation: "create" | "update" | "delete";
    table: string;
    data: Record<string, unknown>;
    createdAt: Date;
    retryCount: number;
}

// ============================================
// Dexie Database Class
// ============================================
export class NeoEduDB extends Dexie {
    courses!: Table<Course>;
    lessons!: Table<Lesson>;
    quizzes!: Table<Quiz>;
    userProgress!: Table<UserProgress>;
    cachedFiles!: Table<CachedFile>;
    syncQueue!: Table<SyncQueue>;

    constructor() {
        super("NeoEduDB");

        this.version(1).stores({
            courses: "id, instructorId, category, *tags, updatedAt, syncedAt",
            lessons: "id, courseId, type, order, updatedAt, syncedAt",
            quizzes: "id, lessonId, updatedAt",
            userProgress: "id, lessonId, courseId, userId, completed, syncedAt",
            cachedFiles: "id, url, mimeType, cachedAt, expiresAt",
            syncQueue: "++id, operation, table, createdAt",
        });
    }
}

// ============================================
// Database Instance
// ============================================
export const db = new NeoEduDB();

// ============================================
// Sync Queue Helpers
// ============================================
export async function addToSyncQueue(
    operation: SyncQueue["operation"],
    table: string,
    data: Record<string, unknown>
) {
    await db.syncQueue.add({
        operation,
        table,
        data,
        createdAt: new Date(),
        retryCount: 0,
    });
}

export async function processSyncQueue() {
    const items = await db.syncQueue.toArray();

    for (const item of items) {
        try {
            // Use dynamic import to avoid circular dependency
            const { syncService } = await import("./sync");

            // Check if online before attempting sync
            if (!syncService.isOnline()) {
                console.log("Offline - skipping sync queue processing");
                return;
            }

            // Process the item based on table and operation
            await syncItemToServer(item);
            await db.syncQueue.delete(item.id!);
        } catch (error) {
            // Increment retry count, remove after 5 retries
            if (item.retryCount >= 5) {
                console.error("Max retries reached, removing item:", item);
                await db.syncQueue.delete(item.id!);
            } else {
                await db.syncQueue.update(item.id!, {
                    retryCount: item.retryCount + 1,
                });
            }
            console.error("Sync failed for item:", item, error);
        }
    }
}

async function syncItemToServer(item: SyncQueue): Promise<void> {
    const { api } = await import("./api");
    const { operation, table, data } = item;

    switch (table) {
        case "userProgress":
            if (operation === "update" || operation === "create") {
                await api.updateLessonProgress(data.lessonId as string, {
                    completed: data.completed as boolean,
                    time_spent: data.timeSpent as number,
                });
            }
            break;
        default:
            console.warn(`Unknown sync table: ${table}`);
    }
}

// ============================================
// File Cache Helpers
// ============================================
export async function cacheFile(url: string, blob: Blob, expiresIn?: number) {
    const existing = await db.cachedFiles.get({ url });
    if (existing) {
        await db.cachedFiles.update(existing.id, {
            blob,
            cachedAt: new Date(),
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
        });
    } else {
        await db.cachedFiles.add({
            id: crypto.randomUUID(),
            url,
            blob,
            mimeType: blob.type,
            size: blob.size,
            cachedAt: new Date(),
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
        });
    }
}

export async function getCachedFile(url: string): Promise<Blob | null> {
    const cached = await db.cachedFiles.where("url").equals(url).first();

    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
        await db.cachedFiles.delete(cached.id);
        return null;
    }

    return cached.blob;
}

export async function clearExpiredCache() {
    const now = new Date();
    await db.cachedFiles.where("expiresAt").below(now).delete();
}

// ============================================
// Course Helpers
// ============================================
export async function getCourseWithLessons(courseId: string) {
    const course = await db.courses.get(courseId);
    if (!course) return null;

    const lessons = await db.lessons
        .where("courseId")
        .equals(courseId)
        .sortBy("order");

    return { ...course, lessons };
}

export async function searchCourses(query: string) {
    const lowerQuery = query.toLowerCase();

    return db.courses
        .filter(
            (course) =>
                course.title.toLowerCase().includes(lowerQuery) ||
                course.description.toLowerCase().includes(lowerQuery) ||
                course.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        )
        .toArray();
}
