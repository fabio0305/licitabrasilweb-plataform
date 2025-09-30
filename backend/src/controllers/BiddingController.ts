import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';
import { UserRole, BiddingStatus } from '@prisma/client';
import NotificationService from '../services/notificationService';

export class BiddingController {
  // Listar licitações públicas (sem autenticação obrigatória)
  async listPublic(req: Request, res: Response) {
    const { page = 1, limit = 10, search, city, state, type, status, categoryId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros para licitações públicas
    const where: any = {
      isPublic: true,
      status: {
        in: ['PUBLISHED', 'OPEN', 'CLOSED', 'AWARDED'],
      },
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { biddingNumber: { contains: search as string } },
      ];
    }

    if (type) {
      where.type = type as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    // Filtros por localização do órgão público
    if (city || state) {
      where.publicEntity = {};
      if (city) {
        where.publicEntity.city = { contains: city as string, mode: 'insensitive' };
      }
      if (state) {
        where.publicEntity.state = state as string;
      }
    }

    const startTime = Date.now();

    const [biddings, total] = await Promise.all([
      prisma.bidding.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          publicEntity: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              entityType: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
        orderBy: {
          openingDate: 'desc',
        },
      }),
      prisma.bidding.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'biddings_public', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        biddings,
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

  // Obter licitação pública por ID
  async getPublicById(req: Request, res: Response) {
    const { id } = req.params;

    const bidding = await prisma.bidding.findFirst({
      where: { 
        id,
        isPublic: true,
        status: {
          in: ['PUBLISHED', 'OPEN', 'CLOSED', 'AWARDED'],
        },
      },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            entityType: true,
            phone: true,
            website: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
        },
        documents: {
          where: {
            isPublic: true,
          },
          select: {
            id: true,
            filename: true,
            originalName: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada ou não é pública');
    }

    res.json({
      success: true,
      data: { bidding },
    });
  }

  // Listar licitações (com autenticação)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, status, type, categoryId } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros baseados no role do usuário
    const where: any = {};
    
    // Filtrar por órgão público se o usuário for PUBLIC_ENTITY
    if (userRole === UserRole.PUBLIC_ENTITY) {
      const publicEntity = await prisma.publicEntity.findUnique({
        where: { userId },
      });
      
      if (publicEntity) {
        where.publicEntityId = publicEntity.id;
      } else {
        // Se não tem perfil de órgão público, retorna vazio
        return res.json({
          success: true,
          data: {
            biddings: [],
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        });
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { biddingNumber: { contains: search as string } },
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    const startTime = Date.now();

    const [biddings, total] = await Promise.all([
      prisma.bidding.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          publicEntity: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              entityType: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.bidding.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'biddings', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        biddings,
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

  // Obter licitação por ID (com autenticação)
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            entityType: true,
            phone: true,
            website: true,
            userId: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            type: true,
            description: true,
            isPublic: true,
            createdAt: true,
          },
        },
        proposals: {
          select: {
            id: true,
            status: true,
            totalValue: true,
            submittedAt: true,
            supplier: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
          orderBy: {
            totalValue: 'asc',
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            totalValue: true,
            supplier: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar permissões para ver dados privados
    const canViewPrivate = userRole === UserRole.ADMIN ||
                          (userRole === UserRole.PUBLIC_ENTITY && bidding.publicEntity.userId === userId);

    // Filtrar documentos privados se necessário
    if (!canViewPrivate) {
      bidding.documents = bidding.documents.filter(doc => doc.isPublic);
    }

    res.json({
      success: true,
      data: { bidding },
    });
  }

  // Criar licitação
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      title,
      description,
      biddingNumber,
      type,
      estimatedValue,
      openingDate,
      closingDate,
      deliveryLocation,
      deliveryDeadline,
      requirements,
      evaluationCriteria,
      isPublic = true,
      categoryIds = [],
    } = req.body;

    // Buscar o perfil do órgão público
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
    });

    if (!publicEntity) {
      throw new ValidationError('Usuário não possui perfil de órgão público');
    }

    // Verificar se o número da licitação já existe
    const existingBidding = await prisma.bidding.findUnique({
      where: { biddingNumber },
    });

    if (existingBidding) {
      throw new ConflictError('Número de licitação já existe');
    }

    // Validar datas
    const openingDateTime = new Date(openingDate);
    const closingDateTime = new Date(closingDate);
    const deliveryDateTime = new Date(deliveryDeadline);

    if (openingDateTime >= closingDateTime) {
      throw new ValidationError('Data de abertura deve ser anterior à data de fechamento');
    }

    if (closingDateTime >= deliveryDateTime) {
      throw new ValidationError('Data de fechamento deve ser anterior ao prazo de entrega');
    }

    const bidding = await prisma.bidding.create({
      data: {
        publicEntityId: publicEntity.id,
        title,
        description,
        biddingNumber,
        type,
        estimatedValue,
        openingDate: openingDateTime,
        closingDate: closingDateTime,
        deliveryLocation,
        deliveryDeadline: deliveryDateTime,
        requirements,
        evaluationCriteria,
        isPublic,
        status: 'DRAFT',
      },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Associar categorias se fornecidas
    if (categoryIds.length > 0) {
      await prisma.biddingCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          biddingId: bidding.id,
          categoryId,
        })),
      });
    }

    logUserActivity(userId, 'BIDDING_CREATED', {
      biddingId: bidding.id,
      biddingNumber: bidding.biddingNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Licitação criada com sucesso',
      data: { bidding },
    });
  }

  // Atualizar licitação
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const {
      title,
      description,
      type,
      estimatedValue,
      openingDate,
      closingDate,
      deliveryLocation,
      deliveryDeadline,
      requirements,
      evaluationCriteria,
      isPublic,
      categoryIds,
    } = req.body;

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: true,
        proposals: { select: { id: true } },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar esta licitação');
    }

    // Verificar se a licitação pode ser editada
    if (bidding.status !== BiddingStatus.DRAFT && bidding.status !== BiddingStatus.PUBLISHED) {
      throw new ValidationError('Licitação não pode ser editada neste status');
    }

    // Se há propostas, não permitir alterações críticas
    if (bidding.proposals.length > 0) {
      throw new ValidationError('Não é possível editar licitação com propostas já submetidas');
    }

    // Validar datas se fornecidas
    let openingDateTime: Date | undefined, closingDateTime: Date | undefined, deliveryDateTime: Date | undefined;

    if (openingDate) openingDateTime = new Date(openingDate);
    if (closingDate) closingDateTime = new Date(closingDate);
    if (deliveryDeadline) deliveryDateTime = new Date(deliveryDeadline);

    if (openingDateTime && closingDateTime && openingDateTime >= closingDateTime) {
      throw new ValidationError('Data de abertura deve ser anterior à data de fechamento');
    }

    if (closingDateTime && deliveryDateTime && closingDateTime >= deliveryDateTime) {
      throw new ValidationError('Data de fechamento deve ser anterior ao prazo de entrega');
    }

    const updatedBidding = await prisma.bidding.update({
      where: { id },
      data: {
        title,
        description,
        type,
        estimatedValue,
        openingDate: openingDateTime,
        closingDate: closingDateTime,
        deliveryLocation,
        deliveryDeadline: deliveryDateTime,
        requirements,
        evaluationCriteria,
        isPublic,
      },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Atualizar categorias se fornecidas
    if (categoryIds && Array.isArray(categoryIds)) {
      // Remover categorias existentes
      await prisma.biddingCategory.deleteMany({
        where: { biddingId: id },
      });

      // Adicionar novas categorias
      if (categoryIds.length > 0) {
        await prisma.biddingCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            biddingId: id,
            categoryId,
          })),
        });
      }
    }

    logUserActivity(userId, 'BIDDING_UPDATED', {
      biddingId: id,
      updatedBy: userRole === UserRole.ADMIN ? 'admin' : 'owner',
    });

    res.json({
      success: true,
      message: 'Licitação atualizada com sucesso',
      data: { bidding: updatedBidding },
    });
  }

  // Publicar licitação
  async publish(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: true,
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para publicar esta licitação');
    }

    // Verificar se a licitação pode ser publicada
    if (bidding.status !== BiddingStatus.DRAFT) {
      throw new ValidationError('Apenas licitações em rascunho podem ser publicadas');
    }

    // Verificar se as datas são válidas
    const now = new Date();
    if (bidding.openingDate <= now) {
      throw new ValidationError('Data de abertura deve ser futura');
    }

    const updatedBidding = await prisma.bidding.update({
      where: { id },
      data: {
        status: BiddingStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logUserActivity(userId, 'BIDDING_PUBLISHED', {
      biddingId: id,
      biddingNumber: bidding.biddingNumber,
    });

    // Notificar fornecedores sobre nova licitação
    const notificationService = NotificationService.getInstance();
    await notificationService.notifyNewBidding(id, bidding.title);

    res.json({
      success: true,
      message: 'Licitação publicada com sucesso',
      data: { bidding: updatedBidding },
    });
  }

  // Cancelar licitação
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: true,
        proposals: { select: { id: true } },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para cancelar esta licitação');
    }

    // Verificar se a licitação pode ser cancelada
    if (bidding.status === BiddingStatus.CANCELLED || bidding.status === BiddingStatus.AWARDED) {
      throw new ValidationError('Licitação não pode ser cancelada neste status');
    }

    const updatedBidding = await prisma.bidding.update({
      where: { id },
      data: {
        status: BiddingStatus.CANCELLED,
      },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logUserActivity(userId, 'BIDDING_CANCELLED', {
      biddingId: id,
      biddingNumber: bidding.biddingNumber,
      reason,
    });

    res.json({
      success: true,
      message: 'Licitação cancelada com sucesso',
      data: { bidding: updatedBidding },
    });
  }

  // Excluir licitação
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: true,
        proposals: { select: { id: true } },
        contract: { select: { id: true } },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para excluir esta licitação');
    }

    // Verificar se a licitação pode ser excluída
    if (bidding.status !== BiddingStatus.DRAFT) {
      throw new ValidationError('Apenas licitações em rascunho podem ser excluídas');
    }

    if (bidding.proposals.length > 0 || bidding.contract) {
      throw new ValidationError('Não é possível excluir licitação com propostas ou contratos associados');
    }

    await prisma.bidding.delete({
      where: { id },
    });

    logUserActivity(userId, 'BIDDING_DELETED', {
      biddingId: id,
      biddingNumber: bidding.biddingNumber,
    });

    res.json({
      success: true,
      message: 'Licitação excluída com sucesso',
    });
  }

  // Abrir licitação automaticamente (chamado por job scheduler)
  async openBidding(biddingId: string) {
    const bidding = await prisma.bidding.findUnique({
      where: { id: biddingId },
    });

    if (!bidding || bidding.status !== BiddingStatus.PUBLISHED) {
      return;
    }

    const now = new Date();
    if (bidding.openingDate <= now) {
      await prisma.bidding.update({
        where: { id: biddingId },
        data: {
          status: BiddingStatus.OPEN,
        },
      });
    }
  }

  // Fechar licitação automaticamente (chamado por job scheduler)
  async closeBidding(biddingId: string) {
    const bidding = await prisma.bidding.findUnique({
      where: { id: biddingId },
    });

    if (!bidding || bidding.status !== BiddingStatus.OPEN) {
      return;
    }

    const now = new Date();
    if (bidding.closingDate <= now) {
      await prisma.bidding.update({
        where: { id: biddingId },
        data: {
          status: BiddingStatus.CLOSED,
        },
      });
    }
  }
}
