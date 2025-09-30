declare class SchedulerService {
    private static instance;
    private notificationService;
    private backupService;
    private constructor();
    static getInstance(): SchedulerService;
    startScheduledTasks(): void;
    private checkBiddingsClosingSoon;
    private autoCloseBiddings;
    private autoOpenBiddings;
    private cleanupOldNotifications;
    private sendDailyStats;
    private performAutomaticBackup;
    stopScheduledTasks(): void;
    getTasksStatus(): {
        totalTasks: number;
        runningTasks: number;
    };
}
export default SchedulerService;
//# sourceMappingURL=schedulerService.d.ts.map