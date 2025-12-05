"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_js_1 = require("./services/db.js");
const cache_js_1 = require("./services/cache.js");
const socket_js_1 = require("./services/socket.js");
const auth_js_1 = require("./routes/auth.js");
const courses_js_1 = require("./routes/courses.js");
const lessons_js_1 = require("./routes/lessons.js");
const users_js_1 = require("./routes/users.js");
const error_js_1 = require("./middleware/error.js");
// ============================================
// Environment Configuration
// ============================================
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// ============================================
// Express App Setup
// ============================================
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.IO setup with CORS
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    },
    // Memory optimization
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
});
// ============================================
// Middleware
// ============================================
// Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
}));
// CORS
app.use((0, cors_1.default)({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Rate limiting (memory-efficient)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});
app.use(limiter);
// Body parsing with size limits
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// Request logging (minimal for memory)
if (NODE_ENV === "development") {
    app.use((req, _res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}
// ============================================
// Health Check
// ============================================
app.get("/health", async (_req, res) => {
    try {
        const dbStatus = await db_js_1.pool.query("SELECT 1");
        const redisStatus = await cache_js_1.redis.ping();
        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus ? "connected" : "disconnected",
                redis: redisStatus === "PONG" ? "connected" : "disconnected",
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
            },
        });
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// ============================================
// API Routes
// ============================================
app.use("/auth", auth_js_1.authRouter);
app.use("/courses", courses_js_1.coursesRouter);
app.use("/lessons", lessons_js_1.lessonsRouter);
app.use("/users", users_js_1.usersRouter);
// ============================================
// 404 Handler
// ============================================
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
// ============================================
// Error Handler
// ============================================
app.use(error_js_1.errorHandler);
// ============================================
// Socket.IO Handlers
// ============================================
(0, socket_js_1.setupSocketHandlers)(io);
// ============================================
// Graceful Shutdown
// ============================================
const shutdown = async () => {
    console.log("\n🔄 Shutting down gracefully...");
    // Close Socket.IO
    io.close();
    // Close Redis
    await cache_js_1.redis.quit();
    // Close PostgreSQL pool
    await db_js_1.pool.end();
    console.log("✅ All connections closed");
    process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
// ============================================
// Server Start
// ============================================
const startServer = async () => {
    try {
        // Test database connection
        await (0, db_js_1.testConnection)();
        console.log("✅ PostgreSQL connected");
        // Test Redis connection
        await (0, cache_js_1.testRedisConnection)();
        console.log("✅ Redis connected");
        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║             NEO EDU Backend Server                            ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                              ║
║  📊 Environment: ${NODE_ENV.padEnd(43)}║
║  🔗 API: http://localhost:${PORT}                               ║
║  🔌 WebSocket: ws://localhost:${PORT}                           ║
╚═══════════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map