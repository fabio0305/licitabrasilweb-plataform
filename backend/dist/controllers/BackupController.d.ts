import { Request, Response } from 'express';
export declare class BackupController {
    private backupService;
    constructor();
    createBackup(req: Request, res: Response): Promise<void>;
    listBackups(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
    restoreDatabase(req: Request, res: Response): Promise<void>;
    downloadBackup(req: Request, res: Response): Promise<void>;
    deleteBackup(req: Request, res: Response): Promise<void>;
    verifyBackup(req: Request, res: Response): Promise<void>;
    updateBackupSchedule(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=BackupController.d.ts.map