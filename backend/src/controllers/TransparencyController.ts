import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logDatabaseOperation } from '../utils/logger';
import { BiddingStatus, ContractStatus } from '@prisma/client';

export class TransparencyController {
  // Dashboard público de transparência
  async getPublicDashboard(req: Request, res: Response) {
    const startTime = Date.now();

    const [
      totalBiddings,
      openBiddings,
      closedBiddings,
      totalContracts,
      activeContracts,
      totalContractValue,
      recentBiddings,
      topCategories,
      publicEntitiesStats,
    ] = await Promise.all([
      // Total de licitações públicas
      prisma.bidding.count({
        where: { isPublic: true },
      }),
      // Licitações abertas
      prisma.bidding.count({
        where: {
          isPublic: true,
          status: BiddingStatus.OPEN,
        },
      }),
      // Licitações fechadas
      prisma.bidding.count({
        where: {
          isPublic: true,
          status: BiddingStatus.CLOSED,
        },
      }),
      // Total de contratos
      prisma.contract.count(),
      // Contratos ativos
      prisma.contract.count({
        where: { status: ContractStatus.ACTIVE },
      }),
      // Valor total dos contratos
      prisma.contract.aggregate({
        _sum: {
          totalValue: true,
        },
      }),
      // Licitações recentes
      prisma.bidding.findMany({
        where: { isPublic: true },
        take: 10,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          biddingNumber: true,
          status: true,
          estimatedValue: true,
          openingDate: true,
          closingDate: true,
          publicEntity: {
            select: {
              name: true,
              city: true,
              state: true,
            },
          },
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      }),
      // Top categorias mais licitadas
      prisma.biddingCategory.groupBy({
        by: ['categoryId'],
        where: {
          bidding: {
            isPublic: true,
          },
        },
        _count: {
          categoryId: true,
        },
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
        take: 10,
      }),
      // Estatísticas por órgão público
      prisma.publicEntity.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          entityType: true,
          _count: {
            select: {
              biddings: true,
              contracts: true,
            },
          },
        },
        orderBy: {
          biddings: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Buscar nomes das categorias
    const categoryIds = topCategories.map(cat => cat.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, code: true },
    });

    const topCategoriesWithNames = topCategories.map(cat => ({
      ...cat,
      category: categories.find(c => c.id === cat.categoryId),
    }));

    logDatabaseOperation('SELECT', 'transparency_dashboard', Date.now() - startTime);

    res.json({
      success: true,
      data: {
        statistics: {
          totalBiddings,
          openBiddings,
          closedBiddings,
          totalContracts,
          activeContracts,
          totalContractValue: totalContractValue._sum.totalValue || 0,
        },
        recentBiddings,
        topCategories: topCategoriesWithNames,
        publicEntitiesStats,
      },
    });
  }

  // Listar licitações públicas com filtros
  async getPublicBiddings(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      categoryId, 
      city, 
      state, 
      entityType,
      minValue,
      maxValue,
      startDate,
      endDate 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { biddingNumber: { contains: search as string } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as BiddingStatus;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    if (city || state || entityType) {
      where.publicEntity = {};
      if (city) {
        where.publicEntity.city = { contains: city as string, mode: 'insensitive' };
      }
      if (state) {
        where.publicEntity.state = state as string;
      }
      if (entityType) {
        where.publicEntity.entityType = entityType as string;
      }
    }

    if (minValue || maxValue) {
      where.estimatedValue = {};
      if (minValue) {
        where.estimatedValue.gte = Number(minValue);
      }
      if (maxValue) {
        where.estimatedValue.lte = Number(maxValue);
      }
    }

    if (startDate || endDate) {
      where.openingDate = {};
      if (startDate) {
        where.openingDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.openingDate.lte = new Date(endDate as string);
      }
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
          publishedAt: 'desc',
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

  // Listar contratos públicos
  async getPublicContracts(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      city, 
      state,
      minValue,
      maxValue,
      startDate,
      endDate 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { contractNumber: { contains: search as string } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as ContractStatus;
    }

    if (city || state) {
      where.publicEntity = {};
      if (city) {
        where.publicEntity.city = { contains: city as string, mode: 'insensitive' };
      }
      if (state) {
        where.publicEntity.state = state as string;
      }
    }

    if (minValue || maxValue) {
      where.totalValue = {};
      if (minValue) {
        where.totalValue.gte = Number(minValue);
      }
      if (maxValue) {
        where.totalValue.lte = Number(maxValue);
      }
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate as string);
      }
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
              entityType: true,
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              tradeName: true,
              cnpj: true,
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
          signedAt: 'desc',
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

  // Relatório de gastos públicos por período
  async getPublicSpendingReport(req: Request, res: Response) {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = Object.keys(dateFilter).length > 0 ? { signedAt: dateFilter } : {};

    const [
      contractsByStatus,
      spendingByEntity,
      spendingByCategory,
      totalSpending,
      averageContractValue,
    ] = await Promise.all([
      // Contratos por status
      prisma.contract.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
        _sum: {
          totalValue: true,
        },
      }),
      // Gastos por órgão público
      prisma.contract.groupBy({
        by: ['publicEntityId'],
        where,
        _sum: {
          totalValue: true,
        },
        _count: {
          publicEntityId: true,
        },
        orderBy: {
          _sum: {
            totalValue: 'desc',
          },
        },
        take: 10,
      }),
      // Gastos por categoria (através das licitações)
      prisma.contract.findMany({
        where,
        include: {
          bidding: {
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
            },
          },
        },
      }).then(contracts => {
        const categorySpending: { [key: string]: { name: string; total: number; count: number } } = {};
        
        contracts.forEach(contract => {
          contract.bidding.categories.forEach(biddingCategory => {
            const category = biddingCategory.category;
            if (!categorySpending[category.id]) {
              categorySpending[category.id] = {
                name: category.name,
                total: 0,
                count: 0,
              };
            }
            categorySpending[category.id].total += Number(contract.totalValue);
            categorySpending[category.id].count += 1;
          });
        });

        return Object.entries(categorySpending)
          .map(([id, data]) => ({ categoryId: id, ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);
      }),
      // Total gasto
      prisma.contract.aggregate({
        where,
        _sum: {
          totalValue: true,
        },
      }),
      // Valor médio dos contratos
      prisma.contract.aggregate({
        where,
        _avg: {
          totalValue: true,
        },
      }),
    ]);

    // Buscar nomes dos órgãos públicos
    const entityIds = spendingByEntity.map(item => item.publicEntityId);
    const entities = await prisma.publicEntity.findMany({
      where: { id: { in: entityIds } },
      select: { id: true, name: true, city: true, state: true },
    });

    const spendingByEntityWithNames = spendingByEntity.map(item => ({
      ...item,
      entity: entities.find(e => e.id === item.publicEntityId),
    }));

    res.json({
      success: true,
      data: {
        contractsByStatus,
        spendingByEntity: spendingByEntityWithNames,
        spendingByCategory,
        totalSpending: totalSpending._sum.totalValue || 0,
        averageContractValue: averageContractValue._avg.totalValue || 0,
      },
    });
  }
}
