import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@/middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '@/utils/logger';
import { UserRole } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export class DocumentController {
  // Listar documentos do usuário
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, type, entityType, entityId } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros baseado no role do usuário
    const where: any = {};

    if (userRole !== UserRole.ADMIN) {
      where.uploadedBy = userId;
    }

    if (type) {
      where.type = type as string;
    }

    if (entityType && entityId) {
      where.entityType = entityType as string;
      where.entityId = entityId as string;
    }

    const startTime = Date.now();

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: offset,
        take: Number(limit),
        // Não há relacionamento uploadedByUser no schema atual
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.document.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'documents', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  }

  // Obter documento por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const document = await prisma.document.findUnique({
      where: { id },
      // Não há relacionamento uploadedByUser no schema atual
    });

    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && document.uploadedBy !== userId) {
      // Verificar se o usuário tem acesso ao documento baseado na entidade
      const hasAccess = await this.checkDocumentAccess(document, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError('Você não tem permissão para acessar este documento');
      }
    }

    res.json({
      success: true,
      data: { document },
    });
  }

  // Upload de documento
  async upload(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { type, entityType, entityId, description } = req.body;

    // Verificar se o arquivo foi enviado
    if (!req.file) {
      throw new ValidationError('Nenhum arquivo foi enviado');
    }

    const file = req.file;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Tipo de arquivo não permitido');
    }

    // Validar tamanho do arquivo (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new ValidationError('Arquivo muito grande. Tamanho máximo: 10MB');
    }

    // Verificar se o usuário tem permissão para associar o documento à entidade
    if (entityType && entityId) {
      const hasPermission = await this.checkEntityPermission(entityType, entityId, userId);
      if (!hasPermission) {
        throw new AuthorizationError('Você não tem permissão para associar documentos a esta entidade');
      }
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join('uploads', fileName);

    try {
      // Salvar arquivo no sistema de arquivos
      await fs.writeFile(filePath, file.buffer);

      // Salvar informações no banco de dados
      const document = await prisma.document.create({
        data: {
          filename: file.originalname,
          originalName: file.originalname,
          path: filePath,
          size: file.size,
          mimeType: file.mimetype,
          type: type || 'OTHER',
          description,
          uploadedBy: userId,
        },
      });

      logUserActivity(userId, 'DOCUMENT_UPLOADED', { 
        documentId: document.id,
        fileName: file.originalname,
        fileSize: file.size,
        entityType,
        entityId,
      });

      res.status(201).json({
        success: true,
        message: 'Documento enviado com sucesso',
        data: { document },
      });
    } catch (error) {
      // Se houve erro ao salvar no banco, remover o arquivo
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo:', unlinkError);
      }
      throw error;
    }
  }

  // Download de documento
  async download(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && document.uploadedBy !== userId) {
      const hasAccess = await this.checkDocumentAccess(document, userId, userRole);
      if (!hasAccess) {
        throw new AuthorizationError('Você não tem permissão para baixar este documento');
      }
    }

    try {
      // Verificar se o arquivo existe
      await fs.access(document.path);

      logUserActivity(userId, 'DOCUMENT_DOWNLOADED', {
        documentId: id,
        fileName: document.filename,
      });

      // Enviar arquivo
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.sendFile(path.resolve(document.path));
    } catch (error) {
      throw new NotFoundError('Arquivo não encontrado no sistema');
    }
  }

  // Excluir documento
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && document.uploadedBy !== userId) {
      throw new AuthorizationError('Você não tem permissão para excluir este documento');
    }

    try {
      // Remover arquivo do sistema de arquivos
      await fs.unlink(document.path);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      // Continuar com a exclusão do registro mesmo se o arquivo não existir
    }

    // Remover registro do banco de dados
    await prisma.document.delete({
      where: { id },
    });

    logUserActivity(userId, 'DOCUMENT_DELETED', {
      documentId: id,
      fileName: document.filename,
    });

    res.json({
      success: true,
      message: 'Documento excluído com sucesso',
    });
  }

  // Método auxiliar para verificar acesso ao documento
  private async checkDocumentAccess(document: any, userId: string, userRole: UserRole): Promise<boolean> {
    if (!document.entityType || !document.entityId) {
      return false;
    }

    switch (document.entityType) {
      case 'BIDDING':
        // Verificar se o usuário é o dono da licitação ou tem uma proposta
        const bidding = await prisma.bidding.findUnique({
          where: { id: document.entityId },
          include: {
            publicEntity: true,
            proposals: {
              where: { supplier: { userId } },
              select: { id: true },
            },
          },
        });
        return bidding?.publicEntity.userId === userId || bidding?.proposals.length > 0;

      case 'PROPOSAL':
        // Verificar se o usuário é o dono da proposta ou da licitação
        const proposal = await prisma.proposal.findUnique({
          where: { id: document.entityId },
          include: {
            supplier: true,
            bidding: {
              include: { publicEntity: true },
            },
          },
        });
        return proposal?.supplier.userId === userId || proposal?.bidding.publicEntity.userId === userId;

      case 'CONTRACT':
        // Verificar se o usuário é parte do contrato
        const contract = await prisma.contract.findUnique({
          where: { id: document.entityId },
          include: {
            publicEntity: true,
            supplier: true,
          },
        });
        return contract?.publicEntity.userId === userId || contract?.supplier.userId === userId;

      default:
        return false;
    }
  }

  // Método auxiliar para verificar permissão na entidade
  private async checkEntityPermission(entityType: string, entityId: string, userId: string): Promise<boolean> {
    switch (entityType) {
      case 'BIDDING':
        const bidding = await prisma.bidding.findUnique({
          where: { id: entityId },
          include: { publicEntity: true },
        });
        return bidding?.publicEntity.userId === userId;

      case 'PROPOSAL':
        const proposal = await prisma.proposal.findUnique({
          where: { id: entityId },
          include: { supplier: true },
        });
        return proposal?.supplier.userId === userId;

      case 'CONTRACT':
        const contract = await prisma.contract.findUnique({
          where: { id: entityId },
          include: {
            publicEntity: true,
            supplier: true,
          },
        });
        return contract?.publicEntity.userId === userId || contract?.supplier.userId === userId;

      default:
        return false;
    }
  }
}
