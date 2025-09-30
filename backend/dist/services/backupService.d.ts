interface BackupOptions {
    includeUploads?: boolean;
    includeDatabase?: boolean;
    retentionDays?: number;
}
declare class BackupService {
    private static instance;
    private notificationService;
    private backupDir;
    private constructor();
    static getInstance(): BackupService;
    private ensureBackupDirectory;
    private backupDatabase;
    private backupUploads;
    private cleanupOldBackups;
    private formatFileSize;
    createFullBackup(options?: BackupOptions): Promise<{
        success: boolean;
        files: string[];
        totalSize: number;
        duration: number;
    }>;
    listBackups(): Promise<Array<{
        filename: string;
        size: number;
        sizeFormatted: string;
        createdAt: Date;
        type: 'database' | 'uploads' | 'unknown';
    }>>;
    restoreDatabase(backupFilename: string): Promise<boolean>;
    getBackupStatistics(): Promise<{
        totalBackups: number;
        totalSize: number;
        totalSizeFormatted: string;
        oldestBackup?: Date;
        newestBackup?: Date;
        databaseBackups: number;
        uploadsBackups: number;
    }>;
}
export default BackupService;
//# sourceMappingURL=backupService.d.ts.map