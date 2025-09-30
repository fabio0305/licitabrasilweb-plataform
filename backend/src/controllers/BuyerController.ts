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

export class BuyerController {
  // Dashboard do comprador
  async getDashboard(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Buscar o órgão público do usuário
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Perfil de órgão público não encontrado');
    }

    const startTime = Date.now();

    const [
      totalBiddings,
      draftBiddings,
      openBiddings,
      closedBiddings,
      activeContracts,
      totalContractValue,
      recentBiddings,
      pendingProposals,
    ] = await Promise.all([
      // Total de licitações
      prisma.bidding.count({
        where: { publicEntityId: publicEntity.id },
      }),
      // Licitações em rascunho
      prisma.bidding.count({
        where: {
          publicEntityId: publicEntity.id,
          status: BiddingStatus.DRAFT,
        },
      }),
      // Licitações abertas
      prisma.bidding.count({
        where: {
          publicEntityId: publicEntity.id,
          status: BiddingStatus.OPEN,
        },
      }),
      // Licitações fechadas
      prisma.bidding.count({
        where: {
          publicEntityId: publicEntity.id,
          status: BiddingStatus.CLOSED,
        },
      }),
      // Contratos ativos
      prisma.contract.count({
        where: {
          publicEntityId: publicEntity.id,
          status: 'ACTIVE',
        },
      }),
      // Valor total dos contratos
      prisma.contract.aggregate({
        where: { publicEntityId: publicEntity.id },
        _sum: {
          totalValue: true,
        },
      }),
      // Licitações recentes
      prisma.bidding.findMany({
        where: { publicEntityId: publicEntity.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          biddingNumber: true,
          status: true,
          estimatedValue: true,
          openingDate: true,
          closingDate: true,
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      }),
      // Propostas pendentes de análise
      prisma.proposal.count({
        where: {
          bidding: {
            publicEntityId: publicEntity.id,
          },
          status: 'SUBMITTED',
        },
      }),
    ]);

    logDatabaseOperation('SELECT', 'buyer_dashboard', Date.now() - startTime);

    res.json({
      success: true,
      data: {
        statistics: {
          totalBiddings,
          draftBiddings,
          openBiddings,
          closedBiddings,
          activeContracts,
          totalContractValue: totalContractValue._sum.totalValue || 0,
          pendingProposals,
        },
        recentBiddings,
      },
    });
  }

  // Listar licitações do comprador
  async getMyBiddings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o órgão público do usuário
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Perfil de órgão público não encontrado');
    }

    const where: any = {
      publicEntityId: publicEntity.id,
    };

    if (status) {
      where.status = status as BiddingStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { biddingNumber: { contains: search as string } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [biddings, total] = await Promise.all([
      prisma.bidding.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
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

  // Listar propostas recebidas
  async getReceivedProposals(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, biddingId, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o órgão público do usuário
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Perfil de órgão público não encontrado');
    }

    const where: any = {
      bidding: {
        publicEntityId: publicEntity.id,
      },
    };

    if (biddingId) {
      where.biddingId = biddingId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          bidding: {
            select: {
              id: true,
              title: true,
              biddingNumber: true,
              status: true,
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              tradeName: true,
              cnpj: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        proposals,
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

  // Listar contratos do comprador
  async getMyContracts(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o órgão público do usuário
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Perfil de órgão público não encontrado');
    }

    const where: any = {
      publicEntityId: publicEntity.id,
    };

    if (status) {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { contractNumber: { contains: search as string } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              tradeName: true,
              cnpj: true,
            },
          },
          bidding: {
            select: {
              id: true,
              title: true,
              biddingNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contract.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        contracts,
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

  // Relatório de compras
  async getPurchaseReport(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { startDate, endDate, categoryId } = req.query;

    // Buscar o órgão público do usuário
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!publicEntity) {
      throw new NotFoundError('Perfil de órgão público não encontrado');
    }

    const where: any = {
      publicEntityId: publicEntity.id,
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    const [
      biddingsByStatus,
      contractsByStatus,
      totalSpent,
      averageBiddingValue,
      topCategories,
    ] = await Promise.all([
      prisma.bidding.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
        _sum: {
          estimatedValue: true,
        },
      }),
      prisma.contract.groupBy({
        by: ['status'],
        where: {
          publicEntityId: publicEntity.id,
          ...(startDate && endDate && {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          }),
        },
        _count: {
          status: true,
        },
        _sum: {
          totalValue: true,
        },
      }),
      prisma.contract.aggregate({
        where: {
          publicEntityId: publicEntity.id,
          ...(startDate && endDate && {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          }),
        },
        _sum: {
          totalValue: true,
        },
      }),
      prisma.bidding.aggregate({
        where,
        _avg: {
          estimatedValue: true,
        },
      }),
      prisma.biddingCategory.groupBy({
        by: ['categoryId'],
        where: {
          bidding: where,
        },
        _count: {
          categoryId: true,
        },
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        biddingsByStatus,
        contractsByStatus,
        totalSpent: totalSpent._sum.totalValue || 0,
        averageBiddingValue: averageBiddingValue._avg.estimatedValue || 0,
        topCategories,
      },
    });
  }
}
