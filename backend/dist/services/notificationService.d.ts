import WebSocketService from './websocket';
interface NotificationData {
    title: string;
    message: string;
    type: string;
    userId?: string;
    relatedId?: string;
    relatedType?: string;
    metadata?: any;
}
interface BulkNotificationData {
    title: string;
    message: string;
    type: string;
    userIds: string[];
    relatedId?: string;
    relatedType?: string;
    metadata?: any;
}
declare class NotificationService {
    private static instance;
    private websocketService?;
    private emailService;
    private constructor();
    static getInstance(): NotificationService;
    setWebSocketService(websocketService: WebSocketService): void;
    createNotification(data: NotificationData): Promise<void>;
    createBulkNotifications(data: BulkNotificationData): Promise<void>;
    notifyNewBidding(biddingId: string, biddingTitle: string): Promise<void>;
    notifyProposalReceived(publicEntityUserId: string, biddingTitle: string, supplierName: string, proposalId: string): Promise<void>;
    notifyProposalStatusChange(supplierUserId: string, biddingTitle: string, status: string, proposalId: string): Promise<void>;
    notifyBiddingClosingSoon(biddingId: string, biddingTitle: string, hoursLeft: number): Promise<void>;
    notifyAdmins(title: string, message: string, type: string, metadata?: any): Promise<void>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
    }>;
}
export default NotificationService;
//# sourceMappingURL=notificationService.d.ts.map