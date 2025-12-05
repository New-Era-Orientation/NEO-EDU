import pg from "pg";
export declare const pool: pg.Pool;
export declare function testConnection(): Promise<boolean>;
export declare function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>>;
export declare function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T>;
export declare function searchFullText(table: string, column: string, searchTerm: string, limit?: number): Promise<unknown[]>;
//# sourceMappingURL=db.d.ts.map