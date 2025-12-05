import Redis from "ioredis";
export declare const redis: Redis;
export declare function testRedisConnection(): Promise<boolean>;
/**
 * Get cached value or fetch from source
 */
export declare function getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
/**
 * Set cached value
 */
export declare function setCache(key: string, value: unknown, ttl?: number): Promise<void>;
/**
 * Get cached value
 */
export declare function getCache<T>(key: string): Promise<T | null>;
/**
 * Delete cached value
 */
export declare function deleteCache(key: string): Promise<void>;
/**
 * Delete multiple keys by pattern
 */
export declare function deleteCachePattern(pattern: string): Promise<void>;
export declare function setSession(sessionId: string, userId: string, data?: Record<string, unknown>): Promise<void>;
export declare function getSession(sessionId: string): Promise<{
    userId: string;
} | null>;
export declare function deleteSession(sessionId: string): Promise<void>;
export declare function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
}>;
//# sourceMappingURL=cache.d.ts.map