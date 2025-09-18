import { Server as HTTPServer } from 'http';
import { UserRole } from '@prisma/client';
declare class WebSocketService {
    private io;
    private connectedUsers;
    constructor(server: HTTPServer);
    private setupMiddleware;
    private setupEventHandlers;
    notifyUser(userId: string, event: string, data: any): void;
    notifyRole(role: UserRole, event: string, data: any): void;
    notifyBidding(biddingId: string, event: string, data: any): void;
    notifyAdmins(event: string, data: any): void;
    broadcast(event: string, data: any): void;
    isUserOnline(userId: string): boolean;
    getConnectionStats(): {
        totalConnections: number;
        uniqueUsers: number;
        connectedUsers: string[];
    };
}
export default WebSocketService;
//# sourceMappingURL=websocket.d.ts.map