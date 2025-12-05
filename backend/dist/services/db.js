"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
exports.query = query;
exports.withTransaction = withTransaction;
exports.searchFullText = searchFullText;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
// ============================================
// PostgreSQL Connection Pool
// Optimized for 1GB RAM environment
// ============================================
exports.pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
        "postgresql://neoedu:neoedu_secure_password_change_me@localhost:5432/neoedu_db",
    // Connection pool settings (memory optimized)
    max: 10, // Maximum connections
    min: 2, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000,
    // Application name for monitoring
    application_name: "neoedu-backend",
});
// ============================================
// Connection Test
// ============================================
async function testConnection() {
    try {
        const client = await exports.pool.connect();
        await client.query("SELECT NOW()");
        client.release();
        return true;
    }
    catch (error) {
        console.error("PostgreSQL connection error:", error);
        throw error;
    }
}
// ============================================
// Query Helper with Error Handling
// ============================================
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        // Log slow queries (>100ms)
        if (duration > 100) {
            console.warn(`Slow query (${duration}ms):`, text);
        }
        return result;
    }
    catch (error) {
        console.error("Query error:", error);
        throw error;
    }
}
// ============================================
// Transaction Helper
// ============================================
async function withTransaction(callback) {
    const client = await exports.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
// ============================================
// Full-Text Search Helper
// ============================================
async function searchFullText(table, column, searchTerm, limit = 20) {
    const result = await query(`SELECT *, 
            ts_rank(to_tsvector('english', ${column}), plainto_tsquery('english', $1)) as rank
     FROM ${table}
     WHERE to_tsvector('english', ${column}) @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`, [searchTerm, limit]);
    return result.rows;
}
//# sourceMappingURL=db.js.map