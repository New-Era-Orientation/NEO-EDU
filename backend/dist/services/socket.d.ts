import { Server as SocketServer } from "socket.io";
export declare function setupSocketHandlers(io: SocketServer): void;
export declare function broadcastToUser(io: SocketServer, userId: string, event: string, data: unknown): void;
export declare function broadcastToCourse(io: SocketServer, courseId: string, event: string, data: unknown): void;
export declare function broadcastToAll(io: SocketServer, event: string, data: unknown): void;
//# sourceMappingURL=socket.d.ts.map