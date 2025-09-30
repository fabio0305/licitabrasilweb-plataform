"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const notificationService_1 = __importDefault(require("./notificationService"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class BackupService {
    constructor() {
        this.notificationService = notificationService_1.default.getInstance();
        this.backupDir = process.env.BACKUP_DIR || './backups';
    }
    static getInstance() {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }
    async ensureBackupDirectory() {
        try {
            await promises_1.default.access(this.backupDir);
        }
        catch {
            await promises_1.default.mkdir(this.backupDir, { recursive: true });
            logger_1.logger.info(`Diretório de backup criado: ${this.backupDir}`);
        }
    }
    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-backup-${timestamp}.sql`;
        const filepath = path_1.default.join(this.backupDir, filename);
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL não configurada');
        }
        const url = new URL(dbUrl);
        const dbName = url.pathname.slice(1);
        const dbHost = url.hostname;
        const dbPort = url.port || '5432';
        const dbUser = url.username;
        const dbPassword = url.password;
        const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-privileges > "${filepath}"`;
        try {
            await execAsync(command);
            logger_1.logger.info(`Backup do banco de dados criado: ${filename}`);
            return filepath;
        }
        catch (error) {
            logger_1.logger.error('Erro ao fazer backup do banco de dados:', error);
            throw error;
        }
    }
    async backupUploads() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `uploads-backup-${timestamp}.tar.gz`;
        const filepath = path_1.default.join(this.backupDir, filename);
        const uploadsDir = process.env.UPLOAD_PATH || './uploads';
        try {
            await promises_1.default.access(uploadsDir);
            const command = `tar -czf "${filepath}" -C "${path_1.default.dirname(uploadsDir)}" "${path_1.default.basename(uploadsDir)}"`;
            await execAsync(command);
            logger_1.logger.info(`Backup dos uploads criado: ${filename}`);
            return filepath;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                logger_1.logger.warn('Diretório de uploads não encontrado, pulando backup de arquivos');
                return '';
            }
            logger_1.logger.error('Erro ao fazer backup dos uploads:', error);
            throw error;
        }
    }
    async cleanupOldBackups(retentionDays = 30) {
        try {
            const files = await promises_1.default.readdir(this.backupDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            let deletedCount = 0;
            for (const file of files) {
                const filepath = path_1.default.join(this.backupDir, file);
                const stats = await promises_1.default.stat(filepath);
                if (stats.mtime < cutoffDate) {
                    await promises_1.default.unlink(filepath);
                    deletedCount++;
                    logger_1.logger.info(`Backup antigo removido: ${file}`);
                }
            }
            if (deletedCount > 0) {
                logger_1.logger.info(`${deletedCount} backups antigos removidos`);
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao limpar backups antigos:', error);
        }
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    async createFullBackup(options = {}) {
        const startTime = Date.now();
        const { includeDatabase = true, includeUploads = true, retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30'), } = options;
        try {
            await this.ensureBackupDirectory();
            const backupFiles = [];
            let totalSize = 0;
            if (includeDatabase) {
                const dbBackupPath = await this.backupDatabase();
                if (dbBackupPath) {
                    backupFiles.push(dbBackupPath);
                    const stats = await promises_1.default.stat(dbBackupPath);
                    totalSize += stats.size;
                }
            }
            if (includeUploads) {
                const uploadsBackupPath = await this.backupUploads();
                if (uploadsBackupPath) {
                    backupFiles.push(uploadsBackupPath);
                    const stats = await promises_1.default.stat(uploadsBackupPath);
                    totalSize += stats.size;
                }
            }
            await this.cleanupOldBackups(retentionDays);
            const duration = Date.now() - startTime;
            await this.notificationService.notifyAdmins('Backup Realizado com Sucesso', `Backup completo realizado em ${Math.round(duration / 1000)}s. Tamanho total: ${this.formatFileSize(totalSize)}`, 'BACKUP_COMPLETED', {
                files: backupFiles.map(f => path_1.default.basename(f)),
                totalSize,
                duration,
                timestamp: new Date().toISOString(),
            });
            logger_1.logger.info(`Backup completo realizado com sucesso em ${duration}ms`);
            return {
                success: true,
                files: backupFiles,
                totalSize,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error('Erro ao realizar backup:', error);
            await this.notificationService.notifyAdmins('Erro no Backup', `Falha ao realizar backup: ${error.message}`, 'BACKUP_FAILED', {
                error: error.message,
                duration,
                timestamp: new Date().toISOString(),
            });
            return {
                success: false,
                files: [],
                totalSize: 0,
                duration,
            };
        }
    }
    async listBackups() {
        try {
            await this.ensureBackupDirectory();
            const files = await promises_1.default.readdir(this.backupDir);
            const backups = [];
            for (const file of files) {
                const filepath = path_1.default.join(this.backupDir, file);
                const stats = await promises_1.default.stat(filepath);
                let type = 'unknown';
                if (file.includes('database-backup')) {
                    type = 'database';
                }
                else if (file.includes('uploads-backup')) {
                    type = 'uploads';
                }
                backups.push({
                    filename: file,
                    size: stats.size,
                    sizeFormatted: this.formatFileSize(stats.size),
                    createdAt: stats.mtime,
                    type,
                });
            }
            return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch (error) {
            logger_1.logger.error('Erro ao listar backups:', error);
            return [];
        }
    }
    async restoreDatabase(backupFilename) {
        try {
            const backupPath = path_1.default.join(this.backupDir, backupFilename);
            await promises_1.default.access(backupPath);
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) {
                throw new Error('DATABASE_URL não configurada');
            }
            const url = new URL(dbUrl);
            const dbName = url.pathname.slice(1);
            const dbHost = url.hostname;
            const dbPort = url.port || '5432';
            const dbUser = url.username;
            const dbPassword = url.password;
            const command = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} < "${backupPath}"`;
            await execAsync(command);
            logger_1.logger.info(`Banco de dados restaurado a partir de: ${backupFilename}`);
            await this.notificationService.notifyAdmins('Banco de Dados Restaurado', `Banco de dados restaurado com sucesso a partir do backup: ${backupFilename}`, 'DATABASE_RESTORED', {
                backupFile: backupFilename,
                timestamp: new Date().toISOString(),
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro ao restaurar banco de dados:', error);
            await this.notificationService.notifyAdmins('Erro na Restauração', `Falha ao restaurar banco de dados: ${error.message}`, 'RESTORE_FAILED', {
                backupFile: backupFilename,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            return false;
        }
    }
    async getBackupStatistics() {
        const backups = await this.listBackups();
        const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
        const databaseBackups = backups.filter(b => b.type === 'database').length;
        const uploadsBackups = backups.filter(b => b.type === 'uploads').length;
        return {
            totalBackups: backups.length,
            totalSize,
            totalSizeFormatted: this.formatFileSize(totalSize),
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : undefined,
            newestBackup: backups.length > 0 ? backups[0].createdAt : undefined,
            databaseBackups,
            uploadsBackups,
        };
    }
}
exports.default = BackupService;
//# sourceMappingURL=backupService.js.map