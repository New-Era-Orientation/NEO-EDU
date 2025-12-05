"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
exports.broadcastToUser = broadcastToUser;
exports.broadcastToCourse = broadcastToCourse;
exports.broadcastToAll = broadcastToAll;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
// ============================================
// Socket.IO Setup
// ============================================
function setupSocketHandlers(io) {
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        }
        catch {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.userId}`);
        // Join user's personal room
        socket.join(`user:${socket.userId}`);
        // ----------------------------------------
        // Course Room Management
        // ----------------------------------------
        socket.on("join:course", (courseId) => {
            socket.join(`course:${courseId}`);
            console.log(`User ${socket.userId} joined course ${courseId}`);
        });
        socket.on("leave:course", (courseId) => {
            socket.leave(`course:${courseId}`);
            console.log(`User ${socket.userId} left course ${courseId}`);
        });
        // ----------------------------------------
        // Lesson Progress
        // ----------------------------------------
        socket.on("progress:update", (data) => {
            // Broadcast to instructors in the course room
            socket.to(`course:${data.courseId}`).emit("student:progress", {
                userId: socket.userId,
                ...data,
            });
        });
        // ----------------------------------------
        // Live Chat
        // ----------------------------------------
        socket.on("chat:message", (data) => {
            io.to(`course:${data.courseId}`).emit("chat:message", {
                userId: socket.userId,
                message: data.message,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("chat:typing", (courseId) => {
            socket.to(`course:${courseId}`).emit("chat:typing", {
                userId: socket.userId,
            });
        });
        // ----------------------------------------
        // Notifications
        // ----------------------------------------
        socket.on("notification:read", (notificationId) => {
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
function broadcastToUser(io, userId, event, data) {
    io.to(`user:${userId}`).emit(event, data);
}
function broadcastToCourse(io, courseId, event, data) {
    io.to(`course:${courseId}`).emit(event, data);
}
function broadcastToAll(io, event, data) {
    io.emit(event, data);
}
//# sourceMappingURL=socket.js.map