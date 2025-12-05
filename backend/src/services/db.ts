import pg from "pg";

const { Pool } = pg;

// ============================================
// PostgreSQL Connection Pool
// Optimized for 1GB RAM environment
// ============================================
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
        "postgresql://neoedu:neoedu_secure_password_change_me@localhost:5432/neoedu_db",

    // Connection pool settings (memory optimized)
    max: 10,                    // Maximum connections
    min: 2,                     // Minimum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000,

    // Application name for monitoring
    application_name: "neoedu-backend",
});

// ============================================
// Connection Test
// ============================================
export async function testConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        await client.query("SELECT NOW()");
        client.release();
        return true;
    } catch (error) {
        console.error("PostgreSQL connection error:", error);
        throw error;
    }
}

// ============================================
// Query Helper with Error Handling
// ============================================
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<pg.QueryResult<T>> {
    const start = Date.now();
    try {
        const result = await pool.query<T>(text, params);
        const duration = Date.now() - start;

        // Log slow queries (>100ms)
        if (duration > 100) {
            console.warn(`Slow query (${duration}ms):`, text);
        }

        return result;
    } catch (error) {
        console.error("Query error:", error);
        throw error;
    }
}

// ============================================
// Transaction Helper
// ============================================
export async function withTransaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

// ============================================
// Full-Text Search Helper
// ============================================
export async function searchFullText(
    table: string,
    column: string,
    searchTerm: string,
    limit = 20
): Promise<unknown[]> {
    const result = await query(
        `SELECT *, 
            ts_rank(to_tsvector('english', ${column}), plainto_tsquery('english', $1)) as rank
     FROM ${table}
     WHERE to_tsvector('english', ${column}) @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
        [searchTerm, limit]
    );

    return result.rows;
}
