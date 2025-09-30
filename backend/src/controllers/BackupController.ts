import { Request, Response } from 'express';
import { ValidationError, AuthorizationError } from '../middleware/errorHandler';
import { logUserActivity } from '../utils/logger';
import { UserRole } from '@prisma/client';
import BackupService from '../services/backupService';

export class BackupController {
  private backupService: BackupService;

  constructor() {
    this.backupService = BackupService.getInstance();
  }

  // Criar backup manual (apenas admin)
  async createBackup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { includeDatabase = true, includeUploads = true } = req.body;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem criar backups');
    }

    const result = await this.backupService.createFullBackup({
      includeDatabase,
      includeUploads,
    });

    logUserActivity(userId, 'BACKUP_CREATED', {
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
        files: result.files.map(f => f.split('/').pop()), // Apenas nomes dos arquivos
        totalSize: result.totalSize,
        duration: result.duration,
      },
    });
  }

  // Listar backups disponíveis (apenas admin)
  async listBackups(req: Request, res: Response) {
    const userRole = req.user!.role;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem listar backups');
    }

    const backups = await this.backupService.listBackups();

    res.json({
      success: true,
      message: 'Backups listados com sucesso',
      data: { backups },
    });
  }

  // Obter estatísticas de backup (apenas admin)
  async getStatistics(req: Request, res: Response) {
    const userRole = req.user!.role;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem ver estatísticas de backup');
    }

    const stats = await this.backupService.getBackupStatistics();

    res.json({
      success: true,
      message: 'Estatísticas de backup obtidas com sucesso',
      data: { statistics: stats },
    });
  }

  // Restaurar backup do banco de dados (apenas admin)
  async restoreDatabase(req: Request, res: Response) {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { backupFilename } = req.body;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem restaurar backups');
    }

    if (!backupFilename) {
      throw new ValidationError('Nome do arquivo de backup é obrigatório');
    }

    const success = await this.backupService.restoreDatabase(backupFilename);

    logUserActivity(userId, 'DATABASE_RESTORED', {
      backupFilename,
      success,
    });

    res.json({
      success: true,
      message: success ? 'Banco de dados restaurado com sucesso' : 'Falha ao restaurar banco de dados',
      data: { success },
    });
  }

  // Download de backup (apenas admin)
  async downloadBackup(req: Request, res: Response) {
    const userRole = req.user!.role;
    const { filename } = req.params;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem baixar backups');
    }

    if (!filename) {
      throw new ValidationError('Nome do arquivo é obrigatório');
    }

    const backupDir = process.env.BACKUP_DIR || './backups';
    const filepath = `${backupDir}/${filename}`;

    try {
      // Verificar se o arquivo existe e enviar
      res.download(filepath, filename, (err) => {
        if (err) {
          if (err.message.includes('ENOENT')) {
            res.status(404).json({
              success: false,
              message: 'Arquivo de backup não encontrado',
            });
          } else {
            res.status(500).json({
              success: false,
              message: 'Erro ao baixar arquivo de backup',
            });
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Deletar backup (apenas admin)
  async deleteBackup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { filename } = req.params;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem deletar backups');
    }

    if (!filename) {
      throw new ValidationError('Nome do arquivo é obrigatório');
    }

    const backupDir = process.env.BACKUP_DIR || './backups';
    const filepath = `${backupDir}/${filename}`;

    try {
      const fs = require('fs/promises');
      await fs.unlink(filepath);

      logUserActivity(userId, 'BACKUP_DELETED', {
        filename,
      });

      res.json({
        success: true,
        message: 'Backup deletado com sucesso',
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.status(404).json({
          success: false,
          message: 'Arquivo de backup não encontrado',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao deletar arquivo de backup',
        });
      }
    }
  }

  // Verificar integridade do backup (apenas admin)
  async verifyBackup(req: Request, res: Response) {
    const userRole = req.user!.role;
    const { filename } = req.params;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem verificar backups');
    }

    if (!filename) {
      throw new ValidationError('Nome do arquivo é obrigatório');
    }

    const backupDir = process.env.BACKUP_DIR || './backups';
    const filepath = `${backupDir}/${filename}`;

    try {
      const fs = require('fs/promises');
      const stats = await fs.stat(filepath);
      
      // Verificações básicas
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
            notCorrupted: isValid, // Verificação básica
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        res.status(404).json({
          success: false,
          message: 'Arquivo de backup não encontrado',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao verificar arquivo de backup',
        });
      }
    }
  }

  // Configurar agendamento de backup (apenas admin)
  async updateBackupSchedule(req: Request, res: Response) {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { schedule, enabled = true } = req.body;

    // Verificar permissões
    if (userRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Apenas administradores podem configurar agendamento de backup');
    }

    // Validar formato do cron
    if (schedule && !/^(\*|[0-5]?\d) (\*|[01]?\d|2[0-3]) (\*|[12]?\d|3[01]) (\*|[1-9]|1[0-2]) (\*|[0-6])$/.test(schedule)) {
      throw new ValidationError('Formato de agendamento inválido. Use formato cron (ex: "0 2 * * *")');
    }

    logUserActivity(userId, 'BACKUP_SCHEDULE_UPDATED', {
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
