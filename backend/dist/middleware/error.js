"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
// ============================================
// Error Handler Middleware
// ============================================
function errorHandler(err, _req, res, _next) {
    console.error("Error:", err);
    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";
    // Handle specific error types
    if (err.code === "23505") {
        // PostgreSQL unique violation
        statusCode = 409;
        message = "Resource already exists";
    }
    else if (err.code === "23503") {
        // PostgreSQL foreign key violation
        statusCode = 400;
        message = "Referenced resource not found";
    }
    else if (err.code === "22P02") {
        // PostgreSQL invalid text representation (bad UUID, etc.)
        statusCode = 400;
        message = "Invalid input format";
    }
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === "production" && statusCode === 500) {
        message = "Internal server error";
    }
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),
    });
}
// ============================================
// Not Found Handler
// ============================================
function notFoundHandler(_req, res) {
    res.status(404).json({ error: "Not found" });
}
// ============================================
// Async Handler Wrapper
// ============================================
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error.js.map