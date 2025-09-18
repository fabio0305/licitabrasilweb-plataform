import { Request, Response } from 'express';
export declare class NotificationController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    markAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    markAllAsRead(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    deleteAllRead(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
    sendBulk(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=NotificationController.d.ts.map