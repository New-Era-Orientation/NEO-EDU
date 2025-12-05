import Redis from "ioredis";

// ============================================
// Redis Client
// Optimized for 1GB RAM environment (64MB limit)
// ============================================
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
        if (times > 3) {
            console.error("Redis connection failed after 3 retries");
            return null;
        }
        return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
});

// Error handling
redis.on("error", (error) => {
    console.error("Redis error:", error);
});

redis.on("connect", () => {
    console.log("Redis connected");
});

// ============================================
// Connection Test
// ============================================
export async function testRedisConnection(): Promise<boolean> {
    try {
        await redis.connect();
        const pong = await redis.ping();
        return pong === "PONG";
    } catch (error) {
        console.error("Redis connection error:", error);
        throw error;
    }
}

// ============================================
// Cache Helpers
// ============================================

// Default TTL: 5 minutes
const DEFAULT_TTL = 300;

/**
 * Get cached value or fetch from source
 */
export async function getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    try {
        const cached = await redis.get(key);

        if (cached) {
            return JSON.parse(cached) as T;
        }

        const value = await fetchFn();
        await redis.setex(key, ttl, JSON.stringify(value));

        return value;
    } catch (error) {
        // On cache error, just fetch directly
        console.error("Cache error:", error);
        return fetchFn();
    }
}

/**
 * Set cached value
 */
export async function setCache(
    key: string,
    value: unknown,
    ttl: number = DEFAULT_TTL
): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
}

/**
 * Get cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<void> {
    await redis.del(key);
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}

// ============================================
// Session Helpers
// ============================================

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

export async function setSession(
    sessionId: string,
    userId: string,
    data: Record<string, unknown> = {}
): Promise<void> {
    await redis.setex(
        `session:${sessionId}`,
        SESSION_TTL,
        JSON.stringify({ userId, ...data })
    );
}

export async function getSession(
    sessionId: string
): Promise<{ userId: string } | null> {
    const session = await redis.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
}

// ============================================
// Rate Limiting Helpers
// ============================================

export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }

    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
    };
}
