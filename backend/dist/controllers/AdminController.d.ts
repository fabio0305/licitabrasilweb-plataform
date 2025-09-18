import { Request, Response } from 'express';
export declare class AdminController {
    getConfig(req: Request, res: Response): Promise<void>;
    updateConfig(req: Request, res: Response): Promise<void>;
    getAuditLogs(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
    createBackup(req: Request, res: Response): Promise<void>;
    getBackupStatus(req: Request, res: Response): Promise<void>;
    moderateBidding(req: Request, res: Response): Promise<void>;
    getModerationDashboard(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AdminController.d.ts.map