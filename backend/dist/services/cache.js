"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.testRedisConnection = testRedisConnection;
exports.getOrSet = getOrSet;
exports.setCache = setCache;
exports.getCache = getCache;
exports.deleteCache = deleteCache;
exports.deleteCachePattern = deleteCachePattern;
exports.setSession = setSession;
exports.getSession = getSession;
exports.deleteSession = deleteSession;
exports.checkRateLimit = checkRateLimit;
const ioredis_1 = __importDefault(require("ioredis"));
// ============================================
// Redis Client
// Optimized for 1GB RAM environment (64MB limit)
// ============================================
exports.redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379", {
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
exports.redis.on("error", (error) => {
    console.error("Redis error:", error);
});
exports.redis.on("connect", () => {
    console.log("Redis connected");
});
// ============================================
// Connection Test
// ============================================
async function testRedisConnection() {
    try {
        await exports.redis.connect();
        const pong = await exports.redis.ping();
        return pong === "PONG";
    }
    catch (error) {
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
async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
    try {
        const cached = await exports.redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        const value = await fetchFn();
        await exports.redis.setex(key, ttl, JSON.stringify(value));
        return value;
    }
    catch (error) {
        // On cache error, just fetch directly
        console.error("Cache error:", error);
        return fetchFn();
    }
}
/**
 * Set cached value
 */
async function setCache(key, value, ttl = DEFAULT_TTL) {
    await exports.redis.setex(key, ttl, JSON.stringify(value));
}
/**
 * Get cached value
 */
async function getCache(key) {
    const cached = await exports.redis.get(key);
    return cached ? JSON.parse(cached) : null;
}
/**
 * Delete cached value
 */
async function deleteCache(key) {
    await exports.redis.del(key);
}
/**
 * Delete multiple keys by pattern
 */
async function deleteCachePattern(pattern) {
    const keys = await exports.redis.keys(pattern);
    if (keys.length > 0) {
        await exports.redis.del(...keys);
    }
}
// ============================================
// Session Helpers
// ============================================
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days
async function setSession(sessionId, userId, data = {}) {
    await exports.redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify({ userId, ...data }));
}
async function getSession(sessionId) {
    const session = await exports.redis.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
}
async function deleteSession(sessionId) {
    await exports.redis.del(`session:${sessionId}`);
}
// ============================================
// Rate Limiting Helpers
// ============================================
async function checkRateLimit(key, limit, windowSeconds) {
    const current = await exports.redis.incr(key);
    if (current === 1) {
        await exports.redis.expire(key, windowSeconds);
    }
    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
    };
}
//# sourceMappingURL=cache.js.map