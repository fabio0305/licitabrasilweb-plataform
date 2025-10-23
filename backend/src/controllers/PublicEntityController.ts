import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError 
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';
import { UserRole } from '@prisma/client';

export class PublicEntityController {
  // Listar órgãos públicos (público com autenticação)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, city, state, entityType, isActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } },
      ];
    }

    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    if (state) {
      where.state = state as string;
    }

    if (entityType) {
      where.entityType = entityType as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const startTime = Date.now();

    const [publicEntities, total] = await Promise.all([
      prisma.publicEntity.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
          _count: {
            select: {
              biddings: true,
              contracts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.publicEntity.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'public_entities', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        publicEntities,
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

  // Obter órgão público por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            createdAt: true,
          },
        },
        biddings: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
            status: true,
            estimatedValue: true,
            openingDate: true,
            closingDate: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            totalValue: true,
            startDate: true,
            endDate: true,
            supplier: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            biddings: true,
            contracts: true,
            documents: true,
          },
        },
      },
    });

    if (!publicEntity) {
      throw new NotFoundError('Órgão público não encontrado');
    }

    res.json({
      success: true,
      data: { publicEntity },
    });
  }

  // Criar perfil de órgão público
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      name,
      cnpj,
      entityType,
      sphere,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      legalRepresentativeName,
      legalRepresentativeCpf,
      legalRepresentativePosition,
    } = req.body;

    // Verificar se o usuário já tem um perfil de órgão público
    const existingPublicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
    });

    if (existingPublicEntity) {
      throw new ConflictError('Usuário já possui um perfil de órgão público');
    }

    // Verificar se o CNPJ já está em uso
    const existingCnpj = await prisma.publicEntity.findUnique({
      where: { cnpj },
    });

    if (existingCnpj) {
      throw new ConflictError('CNPJ já está em uso por outro órgão público');
    }

    const publicEntity = await prisma.publicEntity.create({
      data: {
        userId,
        name,
        cnpj,
        entityType,
        sphere,
        address,
        city,
        state,
        zipCode,
        phone,
        website,
        legalRepresentativeName,
        legalRepresentativeCpf,
        legalRepresentativePosition,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    logUserActivity(userId, 'PUBLIC_ENTITY_PROFILE_CREATED', { publicEntityId: publicEntity.id });

    res.status(201).json({
      success: true,
      message: 'Perfil de órgão público criado com sucesso',
      data: { publicEntity },
    });
  }

  // Atualizar perfil de órgão público
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const {
      name,
      cnpj,
      entityType,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
    } = req.body;

    // Buscar órgão público
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Órgão público não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este órgão público');
    }

    // Verificar se o CNPJ já está em uso por outro órgão público
    if (cnpj && cnpj !== publicEntity.cnpj) {
      const existingCnpj = await prisma.publicEntity.findUnique({
        where: { cnpj },
      });

      if (existingCnpj) {
        throw new ConflictError('CNPJ já está em uso por outro órgão público');
      }
    }

    const updatedPublicEntity = await prisma.publicEntity.update({
      where: { id },
      data: {
        name,
        cnpj,
        entityType,
        address,
        city,
        state,
        zipCode,
        phone,
        website,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    logUserActivity(userId, 'PUBLIC_ENTITY_PROFILE_UPDATED', { 
      publicEntityId: id,
      updatedBy: userRole === UserRole.ADMIN ? 'admin' : 'owner',
    });

    res.json({
      success: true,
      message: 'Perfil de órgão público atualizado com sucesso',
      data: { publicEntity: updatedPublicEntity },
    });
  }

  // Verificar órgão público (apenas admin)
  async verify(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Órgão público não encontrado');
    }

    const updatedPublicEntity = await prisma.publicEntity.update({
      where: { id },
      data: {
        verifiedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    logUserActivity(userId, 'PUBLIC_ENTITY_VERIFIED', {
      publicEntityId: id,
      publicEntityUserId: publicEntity.userId,
    });

    res.json({
      success: true,
      message: 'Órgão público verificado com sucesso',
      data: { publicEntity: updatedPublicEntity },
    });
  }

  // Excluir órgão público (apenas admin)
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id },
      include: {
        biddings: { select: { id: true } },
        contracts: { select: { id: true } },
      },
    });

    if (!publicEntity) {
      throw new NotFoundError('Órgão público não encontrado');
    }

    // Verificar se o órgão público tem licitações ou contratos ativos
    if (publicEntity.biddings.length > 0 || publicEntity.contracts.length > 0) {
      throw new ValidationError(
        'Não é possível excluir órgão público com licitações ou contratos associados'
      );
    }

    await prisma.publicEntity.delete({
      where: { id },
    });

    logUserActivity(userId, 'PUBLIC_ENTITY_DELETED', {
      publicEntityId: id,
      publicEntityUserId: publicEntity.userId,
    });

    res.json({
      success: true,
      message: 'Órgão público excluído com sucesso',
    });
  }

  // Obter estatísticas do órgão público
  async getStatistics(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id },
    });

    if (!publicEntity) {
      throw new NotFoundError('Órgão público não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para ver estas estatísticas');
    }

    const [
      totalBiddings,
      openBiddings,
      closedBiddings,
      activeContracts,
      completedContracts,
      totalContractValue,
      biddingsByStatus,
    ] = await Promise.all([
      prisma.bidding.count({
        where: { publicEntityId: id },
      }),
      prisma.bidding.count({
        where: {
          publicEntityId: id,
          status: 'OPEN',
        },
      }),
      prisma.bidding.count({
        where: {
          publicEntityId: id,
          status: 'CLOSED',
        },
      }),
      prisma.contract.count({
        where: {
          publicEntityId: id,
          status: 'ACTIVE',
        },
      }),
      prisma.contract.count({
        where: {
          publicEntityId: id,
          status: 'COMPLETED',
        },
      }),
      prisma.contract.aggregate({
        where: { publicEntityId: id },
        _sum: {
          totalValue: true,
        },
      }),
      prisma.bidding.groupBy({
        by: ['status'],
        where: { publicEntityId: id },
        _count: {
          status: true,
        },
      }),
    ]);

    const statistics = {
      biddings: {
        total: totalBiddings,
        open: openBiddings,
        closed: closedBiddings,
        byStatus: biddingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
      },
      contracts: {
        active: activeContracts,
        completed: completedContracts,
        totalValue: totalContractValue._sum.totalValue || 0,
      },
    };

    res.json({
      success: true,
      data: { statistics },
    });
  }
}
