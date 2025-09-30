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

export class CitizenController {
  // Listar cidadãos (apenas para admins)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, city, state, isActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { cpf: { contains: search as string } },
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

    const startTime = Date.now();

    const [citizens, total] = await Promise.all([
      prisma.citizen.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.citizen.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'citizens', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        citizens,
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

  // Obter cidadão por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const citizen = await prisma.citizen.findUnique({
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
      },
    });

    if (!citizen) {
      throw new NotFoundError('Cidadão não encontrado');
    }

    res.json({
      success: true,
      data: { citizen },
    });
  }

  // Criar perfil de cidadão
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { 
      cpf, 
      dateOfBirth, 
      profession, 
      address, 
      city, 
      state, 
      zipCode, 
      interests 
    } = req.body;

    // Verificar se o usuário já possui um perfil de cidadão
    const existingCitizen = await prisma.citizen.findUnique({
      where: { userId },
    });

    if (existingCitizen) {
      throw new ConflictError('Usuário já possui um perfil de cidadão');
    }

    // Verificar se o CPF já está em uso (se fornecido)
    if (cpf) {
      const existingCpf = await prisma.citizen.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        throw new ConflictError('CPF já está em uso por outro cidadão');
      }
    }

    const citizen = await prisma.citizen.create({
      data: {
        userId,
        cpf,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        profession,
        address,
        city,
        state,
        zipCode,
        interests: interests || [],
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

    logUserActivity(userId, 'CITIZEN_PROFILE_CREATED');

    res.status(201).json({
      success: true,
      message: 'Perfil de cidadão criado com sucesso',
      data: { citizen },
    });
  }

  // Atualizar perfil de cidadão
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { 
      cpf, 
      dateOfBirth, 
      profession, 
      address, 
      city, 
      state, 
      zipCode, 
      interests 
    } = req.body;

    const citizen = await prisma.citizen.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!citizen) {
      throw new NotFoundError('Cidadão não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && citizen.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este perfil');
    }

    // Verificar se o CPF já está em uso por outro cidadão
    if (cpf && cpf !== citizen.cpf) {
      const existingCpf = await prisma.citizen.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        throw new ConflictError('CPF já está em uso por outro cidadão');
      }
    }

    const updatedCitizen = await prisma.citizen.update({
      where: { id },
      data: {
        cpf,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        profession,
        address,
        city,
        state,
        zipCode,
        interests: interests || citizen.interests,
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

    logUserActivity(userId, 'CITIZEN_PROFILE_UPDATED');

    res.json({
      success: true,
      message: 'Perfil de cidadão atualizado com sucesso',
      data: { citizen: updatedCitizen },
    });
  }

  // Obter perfil do cidadão atual
  async getMyProfile(req: Request, res: Response) {
    const userId = req.user!.userId;

    const citizen = await prisma.citizen.findUnique({
      where: { userId },
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
      },
    });

    if (!citizen) {
      throw new NotFoundError('Perfil de cidadão não encontrado');
    }

    res.json({
      success: true,
      data: { citizen },
    });
  }

  // Obter licitações de interesse do cidadão
  async getInterestedBiddings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const citizen = await prisma.citizen.findUnique({
      where: { userId },
      select: { interests: true },
    });

    if (!citizen) {
      throw new NotFoundError('Perfil de cidadão não encontrado');
    }

    const where: any = {
      isPublic: true,
      status: status || { not: 'DRAFT' },
    };

    // Filtrar por categorias de interesse se o cidadão tiver interesses definidos
    if (citizen.interests && citizen.interests.length > 0) {
      where.categories = {
        some: {
          category: {
            OR: [
              { name: { in: citizen.interests } },
              { code: { in: citizen.interests } },
            ],
          },
        },
      };
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
          openingDate: 'desc',
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
}
