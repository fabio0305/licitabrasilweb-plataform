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

export class CategoryController {
  // Listar categorias (público)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 50, search, parentId, includeInactive = false } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};
    
    if (!includeInactive || includeInactive === 'false') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (parentId) {
      where.parentId = parentId === 'null' ? null : parentId as string;
    }

    const startTime = Date.now();

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
            where: {
              isActive: true,
            },
          },
          _count: {
            select: {
              children: true,
              biddings: true,
              suppliers: true,
            },
          },
        },
        orderBy: [
          { parentId: 'asc' },
          { name: 'asc' },
        ],
      }),
      prisma.category.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'categories', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        categories,
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

  // Obter árvore de categorias
  async getTree(req: Request, res: Response) {
    const { includeInactive = false } = req.query;

    const where: any = {};
    if (!includeInactive || includeInactive === 'false') {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where,
          include: {
            children: {
              where,
              include: {
                children: {
                  where,
                  orderBy: { name: 'asc' },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            biddings: true,
            suppliers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filtrar apenas categorias raiz (sem parent)
    const rootCategories = categories.filter(cat => !cat.parentId);

    res.json({
      success: true,
      data: { categories: rootCategories },
    });
  }

  // Obter categoria por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
        biddings: {
          select: {
            bidding: {
              select: {
                id: true,
                title: true,
                biddingNumber: true,
                status: true,
              },
            },
          },
          take: 10,
        },
        suppliers: {
          select: {
            supplier: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            children: true,
            biddings: true,
            suppliers: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }

    res.json({
      success: true,
      data: { category },
    });
  }

  // Criar categoria (apenas admin)
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      name,
      description,
      code,
      parentId,
    } = req.body;

    // Verificar se o código já existe
    const existingCode = await prisma.category.findUnique({
      where: { code },
    });

    if (existingCode) {
      throw new ConflictError('Código de categoria já existe');
    }

    // Verificar se o nome já existe no mesmo nível
    const existingName = await prisma.category.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingName) {
      throw new ConflictError('Nome de categoria já existe neste nível');
    }

    // Verificar se a categoria pai existe (se fornecida)
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundError('Categoria pai não encontrada');
      }

      if (!parentCategory.isActive) {
        throw new ValidationError('Categoria pai deve estar ativa');
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        code,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CATEGORY_CREATED', { 
      categoryId: category.id,
      categoryName: category.name,
      categoryCode: category.code,
    });

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: { category },
    });
  }

  // Atualizar categoria (apenas admin)
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const {
      name,
      description,
      code,
      parentId,
      isActive,
    } = req.body;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }

    // Verificar se o código já existe (se alterado)
    if (code && code !== category.code) {
      const existingCode = await prisma.category.findUnique({
        where: { code },
      });

      if (existingCode) {
        throw new ConflictError('Código de categoria já existe');
      }
    }

    // Verificar se o nome já existe no mesmo nível (se alterado)
    if (name && (name !== category.name || parentId !== category.parentId)) {
      const existingName = await prisma.category.findFirst({
        where: {
          name,
          parentId: parentId || null,
          id: { not: id },
        },
      });

      if (existingName) {
        throw new ConflictError('Nome de categoria já existe neste nível');
      }
    }

    // Verificar se a categoria pai existe (se fornecida)
    if (parentId && parentId !== category.parentId) {
      if (parentId === id) {
        throw new ValidationError('Categoria não pode ser pai de si mesma');
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundError('Categoria pai não encontrada');
      }

      if (!parentCategory.isActive) {
        throw new ValidationError('Categoria pai deve estar ativa');
      }

      // Verificar se não criaria um loop (categoria pai não pode ser filha da categoria atual)
      const isDescendant = await this.isDescendant(parentId, id);
      if (isDescendant) {
        throw new ValidationError('Categoria pai não pode ser descendente da categoria atual');
      }
    }

    // Se desativando a categoria, verificar se não tem filhas ativas
    if (isActive === false && category.isActive && category.children.length > 0) {
      const activeChildren = await prisma.category.count({
        where: {
          parentId: id,
          isActive: true,
        },
      });

      if (activeChildren > 0) {
        throw new ValidationError('Não é possível desativar categoria com subcategorias ativas');
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        code,
        parentId: parentId || null,
        isActive,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CATEGORY_UPDATED', { 
      categoryId: id,
      categoryName: updatedCategory.name,
    });

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: { category: updatedCategory },
    });
  }

  // Excluir categoria (apenas admin)
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        biddings: { select: { id: true } },
        suppliers: { select: { id: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }

    // Verificar se a categoria tem subcategorias
    if (category.children.length > 0) {
      throw new ValidationError('Não é possível excluir categoria com subcategorias');
    }

    // Verificar se a categoria tem licitações ou fornecedores associados
    if (category.biddings.length > 0 || category.suppliers.length > 0) {
      throw new ValidationError('Não é possível excluir categoria com licitações ou fornecedores associados');
    }

    await prisma.category.delete({
      where: { id },
    });

    logUserActivity(userId, 'CATEGORY_DELETED', {
      categoryId: id,
      categoryName: category.name,
    });

    res.json({
      success: true,
      message: 'Categoria excluída com sucesso',
    });
  }

  // Método auxiliar para verificar se uma categoria é descendente de outra
  private async isDescendant(potentialAncestorId: string, categoryId: string): Promise<boolean> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { parentId: true },
    });

    if (!category || !category.parentId) {
      return false;
    }

    if (category.parentId === potentialAncestorId) {
      return true;
    }

    return this.isDescendant(potentialAncestorId, category.parentId);
  }
}
