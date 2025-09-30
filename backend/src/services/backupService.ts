import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import NotificationService from './notificationService';

const execAsync = promisify(exec);

interface BackupOptions {
  includeUploads?: boolean;
  includeDatabase?: boolean;
  retentionDays?: number;
}

class BackupService {
  private static instance: BackupService;
  private notificationService: NotificationService;
  private backupDir: string;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.backupDir = process.env.BACKUP_DIR || './backups';
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Criar diretório de backup se não existir
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Diretório de backup criado: ${this.backupDir}`);
    }
  }

  // Fazer backup do banco de dados PostgreSQL
  private async backupDatabase(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    // Extrair informações da URL do banco
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    // Comando pg_dump
    const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-privileges > "${filepath}"`;

    try {
      await execAsync(command);
      logger.info(`Backup do banco de dados criado: ${filename}`);
      return filepath;
    } catch (error) {
      logger.error('Erro ao fazer backup do banco de dados:', error);
      throw error;
    }
  }

  // Fazer backup dos arquivos de upload
  private async backupUploads(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `uploads-backup-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);
    const uploadsDir = process.env.UPLOAD_PATH || './uploads';

    try {
      // Verificar se o diretório de uploads existe
      await fs.access(uploadsDir);
      
      // Criar arquivo tar.gz
      const command = `tar -czf "${filepath}" -C "${path.dirname(uploadsDir)}" "${path.basename(uploadsDir)}"`;
      await execAsync(command);
      
      logger.info(`Backup dos uploads criado: ${filename}`);
      return filepath;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        logger.warn('Diretório de uploads não encontrado, pulando backup de arquivos');
        return '';
      }
      logger.error('Erro ao fazer backup dos uploads:', error);
      throw error;
    }
  }

  // Limpar backups antigos
  private async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`Backup antigo removido: ${file}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`${deletedCount} backups antigos removidos`);
      }
    } catch (error) {
      logger.error('Erro ao limpar backups antigos:', error);
    }
  }

  // Obter tamanho do arquivo em formato legível
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Fazer backup completo
  public async createFullBackup(options: BackupOptions = {}): Promise<{
    success: boolean;
    files: string[];
    totalSize: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const {
      includeDatabase = true,
      includeUploads = true,
      retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    } = options;

    try {
      await this.ensureBackupDirectory();

      const backupFiles: string[] = [];
      let totalSize = 0;

      // Backup do banco de dados
      if (includeDatabase) {
        const dbBackupPath = await this.backupDatabase();
        if (dbBackupPath) {
          backupFiles.push(dbBackupPath);
          const stats = await fs.stat(dbBackupPath);
          totalSize += stats.size;
        }
      }

      // Backup dos uploads
      if (includeUploads) {
        const uploadsBackupPath = await this.backupUploads();
        if (uploadsBackupPath) {
          backupFiles.push(uploadsBackupPath);
          const stats = await fs.stat(uploadsBackupPath);
          totalSize += stats.size;
        }
      }

      // Limpar backups antigos
      await this.cleanupOldBackups(retentionDays);

      const duration = Date.now() - startTime;

      // Notificar administradores sobre o backup
      await this.notificationService.notifyAdmins(
        'Backup Realizado com Sucesso',
        `Backup completo realizado em ${Math.round(duration / 1000)}s. Tamanho total: ${this.formatFileSize(totalSize)}`,
        'BACKUP_COMPLETED',
        {
          files: backupFiles.map(f => path.basename(f)),
          totalSize,
          duration,
          timestamp: new Date().toISOString(),
        }
      );

      logger.info(`Backup completo realizado com sucesso em ${duration}ms`);

      return {
        success: true,
        files: backupFiles,
        totalSize,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Erro ao realizar backup:', error);

      // Notificar administradores sobre o erro
      await this.notificationService.notifyAdmins(
        'Erro no Backup',
        `Falha ao realizar backup: ${(error as Error).message}`,
        'BACKUP_FAILED',
        {
          error: (error as Error).message,
          duration,
          timestamp: new Date().toISOString(),
        }
      );

      return {
        success: false,
        files: [],
        totalSize: 0,
        duration,
      };
    }
  }

  // Listar backups disponíveis
  public async listBackups(): Promise<Array<{
    filename: string;
    size: number;
    sizeFormatted: string;
    createdAt: Date;
    type: 'database' | 'uploads' | 'unknown';
  }>> {
    try {
      await this.ensureBackupDirectory();
      const files = await fs.readdir(this.backupDir);
      
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        let type: 'database' | 'uploads' | 'unknown' = 'unknown';
        if (file.includes('database-backup')) {
          type = 'database';
        } else if (file.includes('uploads-backup')) {
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
    } catch (error) {
      logger.error('Erro ao listar backups:', error);
      return [];
    }
  }

  // Restaurar backup do banco de dados
  public async restoreDatabase(backupFilename: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, backupFilename);
      
      // Verificar se o arquivo existe
      await fs.access(backupPath);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      // Extrair informações da URL do banco
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbUser = url.username;
      const dbPassword = url.password;

      // Comando psql para restaurar
      const command = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} < "${backupPath}"`;

      await execAsync(command);
      
      logger.info(`Banco de dados restaurado a partir de: ${backupFilename}`);

      // Notificar administradores
      await this.notificationService.notifyAdmins(
        'Banco de Dados Restaurado',
        `Banco de dados restaurado com sucesso a partir do backup: ${backupFilename}`,
        'DATABASE_RESTORED',
        {
          backupFile: backupFilename,
          timestamp: new Date().toISOString(),
        }
      );

      return true;
    } catch (error) {
      logger.error('Erro ao restaurar banco de dados:', error);
      
      await this.notificationService.notifyAdmins(
        'Erro na Restauração',
        `Falha ao restaurar banco de dados: ${(error as Error).message}`,
        'RESTORE_FAILED',
        {
          backupFile: backupFilename,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        }
      );

      return false;
    }
  }

  // Obter estatísticas de backup
  public async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalSize: number;
    totalSizeFormatted: string;
    oldestBackup?: Date;
    newestBackup?: Date;
    databaseBackups: number;
    uploadsBackups: number;
  }> {
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

export default BackupService;
