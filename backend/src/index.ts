import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { pool, testConnection } from "./services/db.js";
import { redis, testRedisConnection } from "./services/cache.js";
import { setupSocketHandlers } from "./services/socket.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { lessonsRouter } from "./routes/lessons.js";
import { usersRouter } from "./routes/users.js";
import { errorHandler } from "./middleware/error.js";

// ============================================
// Environment Configuration
// ============================================
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "cookie_secret_key_change_in_production";

// ============================================
// Express App Setup
// ============================================
const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new SocketServer(httpServer, {
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
app.use(helmet({
    contentSecurityPolicy: NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
}));

// CORS with credentials support for cookies
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));

// Cookie parser for HTTP-only cookies
app.use(cookieParser(COOKIE_SECRET));

// Rate limiting (memory-efficient)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Body parsing with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logging (minimal for memory)
if (NODE_ENV === "development") {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// Health Check
// ============================================
app.get("/health", async (_req: Request, res: Response) => {
    try {
        const dbStatus = await pool.query("SELECT 1");
        const redisStatus = await redis.ping();

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
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// ============================================
// API Routes
// ============================================
app.use("/auth", authRouter);
app.use("/courses", coursesRouter);
app.use("/lessons", lessonsRouter);
app.use("/users", usersRouter);

// ============================================
// 404 Handler
// ============================================
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

// ============================================
// Error Handler
// ============================================
app.use(errorHandler);

// ============================================
// Socket.IO Handlers
// ============================================
setupSocketHandlers(io);

// ============================================
// Graceful Shutdown
// ============================================
const shutdown = async () => {
    console.log("\n🔄 Shutting down gracefully...");

    // Close Socket.IO
    io.close();

    // Close Redis
    await redis.quit();

    // Close PostgreSQL pool
    await pool.end();

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
        await testConnection();
        console.log("✅ PostgreSQL connected");

        // Test Redis connection
        await testRedisConnection();
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
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
