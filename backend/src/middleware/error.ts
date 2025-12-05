import { type Request, type Response, type NextFunction } from "express";

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

// ============================================
// Error Handler Middleware
// ============================================
export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error("Error:", err);

    // Default error response
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // Handle specific error types
    if (err.code === "23505") {
        // PostgreSQL unique violation
        statusCode = 409;
        message = "Resource already exists";
    } else if (err.code === "23503") {
        // PostgreSQL foreign key violation
        statusCode = 400;
        message = "Referenced resource not found";
    } else if (err.code === "22P02") {
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
export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ error: "Not found" });
}

// ============================================
// Async Handler Wrapper
// ============================================
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
