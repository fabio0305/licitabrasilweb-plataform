import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError 
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';
import { UserRole, BiddingStatus, ProposalStatus } from '@prisma/client';

export class SupplierDashboardController {
  // Dashboard do fornecedor
  async getDashboard(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Buscar o fornecedor do usuário
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundError('Perfil de fornecedor não encontrado');
    }

    const startTime = Date.now();

    const [
      totalProposals,
      submittedProposals,
      acceptedProposals,
      rejectedProposals,
      activeContracts,
      completedContracts,
      totalContractValue,
      availableBiddings,
      recentProposals,
    ] = await Promise.all([
      // Total de propostas
      prisma.proposal.count({
        where: { supplierId: supplier.id },
      }),
      // Propostas submetidas
      prisma.proposal.count({
        where: {
          supplierId: supplier.id,
          status: ProposalStatus.SUBMITTED,
        },
      }),
      // Propostas aceitas
      prisma.proposal.count({
        where: {
          supplierId: supplier.id,
          status: ProposalStatus.ACCEPTED,
        },
      }),
      // Propostas rejeitadas
      prisma.proposal.count({
        where: {
          supplierId: supplier.id,
          status: ProposalStatus.REJECTED,
        },
      }),
      // Contratos ativos
      prisma.contract.count({
        where: {
          supplierId: supplier.id,
          status: 'ACTIVE',
        },
      }),
      // Contratos completados
      prisma.contract.count({
        where: {
          supplierId: supplier.id,
          status: 'COMPLETED',
        },
      }),
      // Valor total dos contratos
      prisma.contract.aggregate({
        where: { supplierId: supplier.id },
        _sum: {
          totalValue: true,
        },
      }),
      // Licitações disponíveis para participar
      prisma.bidding.count({
        where: {
          status: BiddingStatus.OPEN,
          isPublic: true,
          closingDate: {
            gt: new Date(),
          },
          proposals: {
            none: {
              supplierId: supplier.id,
            },
          },
        },
      }),
      // Propostas recentes
      prisma.proposal.findMany({
        where: { supplierId: supplier.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalValue: true,
          submittedAt: true,
          bidding: {
            select: {
              id: true,
              title: true,
              biddingNumber: true,
              status: true,
              closingDate: true,
            },
          },
        },
      }),
    ]);

    logDatabaseOperation('SELECT', 'supplier_dashboard', Date.now() - startTime);

    res.json({
      success: true,
      data: {
        statistics: {
          totalProposals,
          submittedProposals,
          acceptedProposals,
          rejectedProposals,
          activeContracts,
          completedContracts,
          totalContractValue: totalContractValue._sum.totalValue || 0,
          availableBiddings,
        },
        recentProposals,
      },
    });
  }

  // Listar licitações disponíveis para o fornecedor
  async getAvailableBiddings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, categoryId, city, state, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o fornecedor do usuário
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
      select: { 
        id: true,
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundError('Perfil de fornecedor não encontrado');
    }

    const where: any = {
      status: BiddingStatus.OPEN,
      isPublic: true,
      closingDate: {
        gt: new Date(),
      },
      proposals: {
        none: {
          supplierId: supplier.id,
        },
      },
    };

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    } else if (supplier.categories.length > 0) {
      // Filtrar por categorias do fornecedor se não especificado
      where.categories = {
        some: {
          categoryId: {
            in: supplier.categories.map(c => c.categoryId),
          },
        },
      };
    }

    if (city) {
      where.publicEntity = {
        city: { contains: city as string, mode: 'insensitive' },
      };
    }

    if (state) {
      where.publicEntity = {
        ...where.publicEntity,
        state: state as string,
      };
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
          _count: {
            select: {
              proposals: true,
            },
          },
        },
        orderBy: {
          closingDate: 'asc',
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

  // Listar propostas do fornecedor
  async getMyProposals(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status, biddingId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o fornecedor do usuário
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundError('Perfil de fornecedor não encontrado');
    }

    const where: any = {
      supplierId: supplier.id,
    };

    if (status) {
      where.status = status as ProposalStatus;
    }

    if (biddingId) {
      where.biddingId = biddingId as string;
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
              closingDate: true,
              publicEntity: {
                select: {
                  name: true,
                  city: true,
                  state: true,
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
          createdAt: 'desc',
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

  // Listar contratos do fornecedor
  async getMyContracts(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Buscar o fornecedor do usuário
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundError('Perfil de fornecedor não encontrado');
    }

    const where: any = {
      supplierId: supplier.id,
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
          publicEntity: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
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

  // Relatório de performance do fornecedor
  async getPerformanceReport(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    // Buscar o fornecedor do usuário
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundError('Perfil de fornecedor não encontrado');
    }

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    } : {};

    const [
      proposalsByStatus,
      contractsByStatus,
      totalEarned,
      averageProposalValue,
      winRate,
    ] = await Promise.all([
      prisma.proposal.groupBy({
        by: ['status'],
        where: {
          supplierId: supplier.id,
          ...dateFilter,
        },
        _count: {
          status: true,
        },
        _sum: {
          totalValue: true,
        },
      }),
      prisma.contract.groupBy({
        by: ['status'],
        where: {
          supplierId: supplier.id,
          ...dateFilter,
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
          supplierId: supplier.id,
          ...dateFilter,
        },
        _sum: {
          totalValue: true,
        },
      }),
      prisma.proposal.aggregate({
        where: {
          supplierId: supplier.id,
          ...dateFilter,
        },
        _avg: {
          totalValue: true,
        },
      }),
      prisma.proposal.findMany({
        where: {
          supplierId: supplier.id,
          ...dateFilter,
        },
        select: {
          status: true,
        },
      }).then(proposals => {
        const total = proposals.length;
        const accepted = proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length;
        return total > 0 ? (accepted / total) * 100 : 0;
      }),
    ]);

    res.json({
      success: true,
      data: {
        proposalsByStatus,
        contractsByStatus,
        totalEarned: totalEarned._sum.totalValue || 0,
        averageProposalValue: averageProposalValue._avg.totalValue || 0,
        winRate,
      },
    });
  }
}
