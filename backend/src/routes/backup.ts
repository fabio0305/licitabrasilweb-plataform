import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const backupController = new BackupController();

/**
 * @swagger
 * components:
 *   schemas:
 *     BackupFile:
 *       type: object
 *       properties:
 *         filename:
 *           type: string
 *           description: Nome do arquivo de backup
 *         size:
 *           type: number
 *           description: Tamanho do arquivo em bytes
 *         sizeFormatted:
 *           type: string
 *           description: Tamanho formatado (ex: "10.5 MB")
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do backup
 *         type:
 *           type: string
 *           enum: [database, uploads, unknown]
 *           description: Tipo do backup
 *     
 *     BackupStatistics:
 *       type: object
 *       properties:
 *         totalBackups:
 *           type: number
 *           description: Total de backups
 *         totalSize:
 *           type: number
 *           description: Tamanho total em bytes
 *         totalSizeFormatted:
 *           type: string
 *           description: Tamanho total formatado
 *         oldestBackup:
 *           type: string
 *           format: date-time
 *           description: Data do backup mais antigo
 *         newestBackup:
 *           type: string
 *           format: date-time
 *           description: Data do backup mais recente
 *         databaseBackups:
 *           type: number
 *           description: Número de backups de banco de dados
 *         uploadsBackups:
 *           type: number
 *           description: Número de backups de uploads
 */

/**
 * @swagger
 * /api/v1/backup:
 *   post:
 *     summary: Criar backup manual
 *     description: Cria um backup completo do sistema (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeDatabase:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir backup do banco de dados
 *               includeUploads:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir backup dos arquivos de upload
 *     responses:
 *       200:
 *         description: Backup criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     files:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalSize:
 *                       type: number
 *                     duration:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, asyncHandler(backupController.createBackup.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup:
 *   get:
 *     summary: Listar backups disponíveis
 *     description: Lista todos os backups disponíveis (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     backups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BackupFile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authenticate, asyncHandler(backupController.listBackups.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/statistics:
 *   get:
 *     summary: Obter estatísticas de backup
 *     description: Obtém estatísticas dos backups (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas de backup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       $ref: '#/components/schemas/BackupStatistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/statistics', authenticate, asyncHandler(backupController.getStatistics.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/restore:
 *   post:
 *     summary: Restaurar backup do banco de dados
 *     description: Restaura o banco de dados a partir de um backup (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupFilename
 *             properties:
 *               backupFilename:
 *                 type: string
 *                 description: Nome do arquivo de backup para restaurar
 *     responses:
 *       200:
 *         description: Banco de dados restaurado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/restore', authenticate, asyncHandler(backupController.restoreDatabase.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/download/{filename}:
 *   get:
 *     summary: Download de arquivo de backup
 *     description: Faz download de um arquivo de backup específico (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo de backup
 *     responses:
 *       200:
 *         description: Arquivo de backup
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/download/:filename', authenticate, asyncHandler(backupController.downloadBackup.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/{filename}:
 *   delete:
 *     summary: Deletar arquivo de backup
 *     description: Deleta um arquivo de backup específico (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo de backup
 *     responses:
 *       200:
 *         description: Backup deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:filename', authenticate, asyncHandler(backupController.deleteBackup.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/verify/{filename}:
 *   get:
 *     summary: Verificar integridade do backup
 *     description: Verifica a integridade de um arquivo de backup (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo de backup
 *     responses:
 *       200:
 *         description: Resultado da verificação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     isValid:
 *                       type: boolean
 *                     size:
 *                       type: number
 *                     sizeInMB:
 *                       type: number
 *                     lastModified:
 *                       type: string
 *                       format: date-time
 *                     checks:
 *                       type: object
 *                       properties:
 *                         fileExists:
 *                           type: boolean
 *                         sizeValid:
 *                           type: boolean
 *                         notCorrupted:
 *                           type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/verify/:filename', authenticate, asyncHandler(backupController.verifyBackup.bind(backupController)));

/**
 * @swagger
 * /api/v1/backup/schedule:
 *   put:
 *     summary: Configurar agendamento de backup
 *     description: Configura o agendamento automático de backups (apenas administradores)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedule:
 *                 type: string
 *                 description: Expressão cron para agendamento (ex: "0 2 * * *")
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: Se o agendamento está habilitado
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/schedule', authenticate, asyncHandler(backupController.updateBackupSchedule.bind(backupController)));

export default router;
