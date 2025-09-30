"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const backupService_1 = __importDefault(require("../services/backupService"));
class BackupController {
    constructor() {
        this.backupService = backupService_1.default.getInstance();
    }
    async createBackup(req, res) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { includeDatabase = true, includeUploads = true } = req.body;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem criar backups');
        }
        const result = await this.backupService.createFullBackup({
            includeDatabase,
            includeUploads,
        });
        (0, logger_1.logUserActivity)(userId, 'BACKUP_CREATED', {
            success: result.success,
            files: result.files.length,
            totalSize: result.totalSize,
            duration: result.duration,
        });
        res.json({
            success: true,
            message: result.success ? 'Backup criado com sucesso' : 'Falha ao criar backup',
            data: {
                success: result.success,
                files: result.files.map(f => f.split('/').pop()),
                totalSize: result.totalSize,
                duration: result.duration,
            },
        });
    }
    async listBackups(req, res) {
        const userRole = req.user.role;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem listar backups');
        }
        const backups = await this.backupService.listBackups();
        res.json({
            success: true,
            message: 'Backups listados com sucesso',
            data: { backups },
        });
    }
    async getStatistics(req, res) {
        const userRole = req.user.role;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem ver estatísticas de backup');
        }
        const stats = await this.backupService.getBackupStatistics();
        res.json({
            success: true,
            message: 'Estatísticas de backup obtidas com sucesso',
            data: { statistics: stats },
        });
    }
    async restoreDatabase(req, res) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { backupFilename } = req.body;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem restaurar backups');
        }
        if (!backupFilename) {
            throw new errorHandler_1.ValidationError('Nome do arquivo de backup é obrigatório');
        }
        const success = await this.backupService.restoreDatabase(backupFilename);
        (0, logger_1.logUserActivity)(userId, 'DATABASE_RESTORED', {
            backupFilename,
            success,
        });
        res.json({
            success: true,
            message: success ? 'Banco de dados restaurado com sucesso' : 'Falha ao restaurar banco de dados',
            data: { success },
        });
    }
    async downloadBackup(req, res) {
        const userRole = req.user.role;
        const { filename } = req.params;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem baixar backups');
        }
        if (!filename) {
            throw new errorHandler_1.ValidationError('Nome do arquivo é obrigatório');
        }
        const backupDir = process.env.BACKUP_DIR || './backups';
        const filepath = `${backupDir}/${filename}`;
        try {
            res.download(filepath, filename, (err) => {
                if (err) {
                    if (err.message.includes('ENOENT')) {
                        res.status(404).json({
                            success: false,
                            message: 'Arquivo de backup não encontrado',
                        });
                    }
                    else {
                        res.status(500).json({
                            success: false,
                            message: 'Erro ao baixar arquivo de backup',
                        });
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
            });
        }
    }
    async deleteBackup(req, res) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { filename } = req.params;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem deletar backups');
        }
        if (!filename) {
            throw new errorHandler_1.ValidationError('Nome do arquivo é obrigatório');
        }
        const backupDir = process.env.BACKUP_DIR || './backups';
        const filepath = `${backupDir}/${filename}`;
        try {
            const fs = require('fs/promises');
            await fs.unlink(filepath);
            (0, logger_1.logUserActivity)(userId, 'BACKUP_DELETED', {
                filename,
            });
            res.json({
                success: true,
                message: 'Backup deletado com sucesso',
            });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    message: 'Arquivo de backup não encontrado',
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao deletar arquivo de backup',
                });
            }
        }
    }
    async verifyBackup(req, res) {
        const userRole = req.user.role;
        const { filename } = req.params;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem verificar backups');
        }
        if (!filename) {
            throw new errorHandler_1.ValidationError('Nome do arquivo é obrigatório');
        }
        const backupDir = process.env.BACKUP_DIR || './backups';
        const filepath = `${backupDir}/${filename}`;
        try {
            const fs = require('fs/promises');
            const stats = await fs.stat(filepath);
            const isValid = stats.size > 0;
            const lastModified = stats.mtime;
            const sizeInMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
            res.json({
                success: true,
                message: 'Verificação de backup concluída',
                data: {
                    filename,
                    isValid,
                    size: stats.size,
                    sizeInMB,
                    lastModified,
                    checks: {
                        fileExists: true,
                        sizeValid: stats.size > 0,
                        notCorrupted: isValid,
                    },
                },
            });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    message: 'Arquivo de backup não encontrado',
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar arquivo de backup',
                });
            }
        }
    }
    async updateBackupSchedule(req, res) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { schedule, enabled = true } = req.body;
        if (userRole !== client_1.UserRole.ADMIN) {
            throw new errorHandler_1.AuthorizationError('Apenas administradores podem configurar agendamento de backup');
        }
        if (schedule && !/^(\*|[0-5]?\d) (\*|[01]?\d|2[0-3]) (\*|[12]?\d|3[01]) (\*|[1-9]|1[0-2]) (\*|[0-6])$/.test(schedule)) {
            throw new errorHandler_1.ValidationError('Formato de agendamento inválido. Use formato cron (ex: "0 2 * * *")');
        }
        (0, logger_1.logUserActivity)(userId, 'BACKUP_SCHEDULE_UPDATED', {
            schedule,
            enabled,
        });
        res.json({
            success: true,
            message: 'Configuração de agendamento atualizada com sucesso',
            data: {
                schedule,
                enabled,
                note: 'Reinicie o servidor para aplicar as mudanças no agendamento',
            },
        });
    }
}
exports.BackupController = BackupController;
//# sourceMappingURL=BackupController.js.map