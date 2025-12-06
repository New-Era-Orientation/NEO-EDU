import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

// ============================================
// Socket.IO Setup
// ============================================
export function setupSocketHandlers(io: SocketServer): void {
    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: string;
                role: string;
            };

            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // ----------------------------------------
        // Course Room Management
        // ----------------------------------------
        socket.on("join:course", (courseId: string) => {
            socket.join(`course:${courseId}`);
            console.log(`User ${socket.userId} joined course ${courseId}`);
        });

        socket.on("leave:course", (courseId: string) => {
            socket.leave(`course:${courseId}`);
            console.log(`User ${socket.userId} left course ${courseId}`);
        });

        // ----------------------------------------
        // Contest Room Management (Live Leaderboard)
        // ----------------------------------------
        socket.on("join:contest", (contestId: string) => {
            socket.join(`contest:${contestId}`);
            console.log(`User ${socket.userId} joined contest ${contestId}`);
        });

        socket.on("leave:contest", (contestId: string) => {
            socket.leave(`contest:${contestId}`);
            console.log(`User ${socket.userId} left contest ${contestId}`);
        });

        // ----------------------------------------
        // Lesson Progress
        // ----------------------------------------
        socket.on("progress:update", (data: {
            courseId: string;
            lessonId: string;
            progress: number;
            completed: boolean;
        }) => {
            // Broadcast to instructors in the course room
            socket.to(`course:${data.courseId}`).emit("student:progress", {
                userId: socket.userId,
                ...data,
            });
        });

        // ----------------------------------------
        // Live Chat
        // ----------------------------------------
        socket.on("chat:message", (data: {
            courseId: string;
            message: string;
        }) => {
            io.to(`course:${data.courseId}`).emit("chat:message", {
                userId: socket.userId,
                message: data.message,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("chat:typing", (courseId: string) => {
            socket.to(`course:${courseId}`).emit("chat:typing", {
                userId: socket.userId,
            });
        });

        // ----------------------------------------
        // Notifications
        // ----------------------------------------
        socket.on("notification:read", (notificationId: string) => {
            // Handle notification read event
            console.log(`User ${socket.userId} read notification ${notificationId}`);
        });

        // ----------------------------------------
        // Disconnect
        // ----------------------------------------
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
        });

        // Error handling
        socket.on("error", (error) => {
            console.error(`Socket error for user ${socket.userId}:`, error);
        });
    });
}

// ============================================
// Broadcast Helpers
// ============================================
export function broadcastToUser(
    io: SocketServer,
    userId: string,
    event: string,
    data: unknown
): void {
    io.to(`user:${userId}`).emit(event, data);
}

export function broadcastToCourse(
    io: SocketServer,
    courseId: string,
    event: string,
    data: unknown
): void {
    io.to(`course:${courseId}`).emit(event, data);
}

export function broadcastToAll(
    io: SocketServer,
    event: string,
    data: unknown
): void {
    io.emit(event, data);
}

export function broadcastToContest(
    io: SocketServer,
    contestId: string,
    event: string,
    data: unknown
): void {
    io.to(`contest:${contestId}`).emit(event, data);
}

