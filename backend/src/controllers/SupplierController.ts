import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError 
} from '@/middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '@/utils/logger';
import { UserRole } from '@prisma/client';

export class SupplierController {
  // Listar fornecedores (público com autenticação)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, city, state, isActive, categoryId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { tradeName: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } },
      ];
    }

    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    if (state) {
      where.state = state as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId as string,
        },
      };
    }

    const startTime = Date.now();

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
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
              contracts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'suppliers', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        suppliers,
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

  // Obter fornecedor por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
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
        proposals: {
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
              },
            },
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
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            proposals: true,
            contracts: true,
            documents: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    res.json({
      success: true,
      data: { supplier },
    });
  }

  // Criar perfil de fornecedor
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      companyName,
      tradeName,
      cnpj,
      stateRegistration,
      municipalRegistration,
      address,
      city,
      state,
      zipCode,
      website,
      description,
    } = req.body;

    // Verificar se o usuário já tem um perfil de fornecedor
    const existingSupplier = await prisma.supplier.findUnique({
      where: { userId },
    });

    if (existingSupplier) {
      throw new ConflictError('Usuário já possui um perfil de fornecedor');
    }

    // Verificar se o CNPJ já está em uso
    const existingCnpj = await prisma.supplier.findUnique({
      where: { cnpj },
    });

    if (existingCnpj) {
      throw new ConflictError('CNPJ já está em uso por outro fornecedor');
    }

    const supplier = await prisma.supplier.create({
      data: {
        userId,
        companyName,
        tradeName,
        cnpj,
        stateRegistration,
        municipalRegistration,
        address,
        city,
        state,
        zipCode,
        website,
        description,
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

    logUserActivity(userId, 'SUPPLIER_PROFILE_CREATED', { supplierId: supplier.id });

    res.status(201).json({
      success: true,
      message: 'Perfil de fornecedor criado com sucesso',
      data: { supplier },
    });
  }

  // Atualizar perfil de fornecedor
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const {
      companyName,
      tradeName,
      cnpj,
      stateRegistration,
      municipalRegistration,
      address,
      city,
      state,
      zipCode,
      website,
      description,
    } = req.body;

    // Buscar fornecedor
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este fornecedor');
    }

    // Verificar se o CNPJ já está em uso por outro fornecedor
    if (cnpj && cnpj !== supplier.cnpj) {
      const existingCnpj = await prisma.supplier.findUnique({
        where: { cnpj },
      });

      if (existingCnpj) {
        throw new ConflictError('CNPJ já está em uso por outro fornecedor');
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        companyName,
        tradeName,
        cnpj,
        stateRegistration,
        municipalRegistration,
        address,
        city,
        state,
        zipCode,
        website,
        description,
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

    logUserActivity(userId, 'SUPPLIER_PROFILE_UPDATED', { 
      supplierId: id,
      updatedBy: userRole === UserRole.ADMIN ? 'admin' : 'owner',
    });

    res.json({
      success: true,
      message: 'Perfil de fornecedor atualizado com sucesso',
      data: { supplier: updatedSupplier },
    });
  }

  // Verificar fornecedor (apenas admin)
  async verify(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    const updatedSupplier = await prisma.supplier.update({
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

    logUserActivity(userId, 'SUPPLIER_VERIFIED', {
      supplierId: id,
      supplierUserId: supplier.userId,
    });

    res.json({
      success: true,
      message: 'Fornecedor verificado com sucesso',
      data: { supplier: updatedSupplier },
    });
  }

  // Excluir fornecedor (apenas admin)
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        proposals: { select: { id: true } },
        contracts: { select: { id: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    // Verificar se o fornecedor tem propostas ou contratos ativos
    if (supplier.proposals.length > 0 || supplier.contracts.length > 0) {
      throw new ValidationError(
        'Não é possível excluir fornecedor com propostas ou contratos associados'
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    logUserActivity(userId, 'SUPPLIER_DELETED', {
      supplierId: id,
      supplierUserId: supplier.userId,
    });

    res.json({
      success: true,
      message: 'Fornecedor excluído com sucesso',
    });
  }

  // Gerenciar categorias do fornecedor
  async addCategory(req: Request, res: Response) {
    const { id } = req.params;
    const { categoryId } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este fornecedor');
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }

    // Verificar se a associação já existe
    const existingAssociation = await prisma.supplierCategory.findUnique({
      where: {
        supplierId_categoryId: {
          supplierId: id,
          categoryId,
        },
      },
    });

    if (existingAssociation) {
      throw new ConflictError('Fornecedor já está associado a esta categoria');
    }

    await prisma.supplierCategory.create({
      data: {
        supplierId: id,
        categoryId,
      },
    });

    logUserActivity(userId, 'SUPPLIER_CATEGORY_ADDED', {
      supplierId: id,
      categoryId,
    });

    res.json({
      success: true,
      message: 'Categoria adicionada ao fornecedor com sucesso',
    });
  }

  // Remover categoria do fornecedor
  async removeCategory(req: Request, res: Response) {
    const { id, categoryId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este fornecedor');
    }

    const association = await prisma.supplierCategory.findUnique({
      where: {
        supplierId_categoryId: {
          supplierId: id,
          categoryId,
        },
      },
    });

    if (!association) {
      throw new NotFoundError('Associação não encontrada');
    }

    await prisma.supplierCategory.delete({
      where: {
        supplierId_categoryId: {
          supplierId: id,
          categoryId,
        },
      },
    });

    logUserActivity(userId, 'SUPPLIER_CATEGORY_REMOVED', {
      supplierId: id,
      categoryId,
    });

    res.json({
      success: true,
      message: 'Categoria removida do fornecedor com sucesso',
    });
  }

  // Obter estatísticas do fornecedor
  async getStatistics(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundError('Fornecedor não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para ver estas estatísticas');
    }

    const [
      totalProposals,
      acceptedProposals,
      activeContracts,
      completedContracts,
      totalContractValue,
    ] = await Promise.all([
      prisma.proposal.count({
        where: { supplierId: id },
      }),
      prisma.proposal.count({
        where: {
          supplierId: id,
          status: 'ACCEPTED',
        },
      }),
      prisma.contract.count({
        where: {
          supplierId: id,
          status: 'ACTIVE',
        },
      }),
      prisma.contract.count({
        where: {
          supplierId: id,
          status: 'COMPLETED',
        },
      }),
      prisma.contract.aggregate({
        where: { supplierId: id },
        _sum: {
          totalValue: true,
        },
      }),
    ]);

    const statistics = {
      proposals: {
        total: totalProposals,
        accepted: acceptedProposals,
        successRate: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0,
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
