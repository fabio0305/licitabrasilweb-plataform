import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError 
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';
import { UserRole, ContractStatus } from '@prisma/client';

export class ContractController {
  // Listar contratos (filtrada por usuário)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, status } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros baseados no role do usuário
    const where: any = {};
    
    if (userRole === UserRole.SUPPLIER) {
      // Fornecedores veem apenas seus próprios contratos
      const supplier = await prisma.supplier.findUnique({
        where: { userId },
      });
      
      if (supplier) {
        where.supplierId = supplier.id;
      } else {
        // Se não tem perfil de fornecedor, retorna vazio
        return res.json({
          success: true,
          data: {
            contracts: [],
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
    } else if (userRole === UserRole.PUBLIC_ENTITY) {
      // Órgãos públicos veem seus próprios contratos
      const publicEntity = await prisma.publicEntity.findUnique({
        where: { userId },
      });
      
      if (publicEntity) {
        where.publicEntityId = publicEntity.id;
      } else {
        return res.json({
          success: true,
          data: {
            contracts: [],
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
    // ADMIN vê todos os contratos (sem filtro adicional)
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { contractNumber: { contains: search as string } },
      ];
    }

    if (status) {
      where.status = status as string;
    }

    const startTime = Date.now();

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          bidding: {
            select: {
              id: true,
              title: true,
              biddingNumber: true,
            },
          },
          publicEntity: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              tradeName: true,
            },
          },
          proposal: {
            select: {
              id: true,
              totalValue: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contract.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'contracts', Date.now() - startTime);

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

  // Obter contrato por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
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
        publicEntity: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        supplier: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        proposal: {
          include: {
            items: true,
          },
        },
        documents: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    const canView = userRole === UserRole.ADMIN ||
                   (userRole === UserRole.SUPPLIER && contract.supplier.userId === userId) ||
                   (userRole === UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId);

    if (!canView) {
      throw new AuthorizationError('Você não tem permissão para ver este contrato');
    }

    res.json({
      success: true,
      data: { contract },
    });
  }

  // Criar contrato (baseado em proposta aceita)
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      proposalId,
      contractNumber,
      title,
      description,
      startDate,
      endDate,
    } = req.body;

    // Buscar o perfil do órgão público
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { userId },
    });

    if (!publicEntity) {
      throw new ValidationError('Usuário não possui perfil de órgão público');
    }

    // Buscar a proposta aceita
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        bidding: true,
        supplier: true,
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar se a proposta foi aceita
    if (proposal.status !== 'ACCEPTED') {
      throw new ValidationError('Apenas propostas aceitas podem gerar contratos');
    }

    // Verificar se a proposta pertence a uma licitação do órgão público
    if (proposal.bidding.publicEntityId !== publicEntity.id) {
      throw new AuthorizationError('Proposta não pertence a uma licitação deste órgão público');
    }

    // Verificar se já existe um contrato para esta proposta
    const existingContract = await prisma.contract.findUnique({
      where: { proposalId },
    });

    if (existingContract) {
      throw new ConflictError('Já existe um contrato para esta proposta');
    }

    // Verificar se o número do contrato já existe
    const existingContractNumber = await prisma.contract.findUnique({
      where: { contractNumber },
    });

    if (existingContractNumber) {
      throw new ConflictError('Número de contrato já existe');
    }

    // Validar datas
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime >= endDateTime) {
      throw new ValidationError('Data de início deve ser anterior à data de fim');
    }

    const contract = await prisma.contract.create({
      data: {
        biddingId: proposal.biddingId,
        proposalId,
        publicEntityId: publicEntity.id,
        supplierId: proposal.supplierId,
        contractNumber,
        title,
        description,
        totalValue: proposal.totalValue,
        startDate: startDateTime,
        endDate: endDateTime,
        status: ContractStatus.DRAFT,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_CREATED', { 
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      proposalId,
    });

    res.status(201).json({
      success: true,
      message: 'Contrato criado com sucesso',
      data: { contract },
    });
  }

  // Atualizar contrato
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const {
      title,
      description,
      startDate,
      endDate,
    } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && contract.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar este contrato');
    }

    // Verificar se o contrato pode ser editado
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ValidationError('Apenas contratos em rascunho podem ser editados');
    }

    // Validar datas se fornecidas
    let startDateTime: Date | undefined, endDateTime: Date | undefined;

    if (startDate) startDateTime = new Date(startDate);
    if (endDate) endDateTime = new Date(endDate);

    if (startDateTime && endDateTime && startDateTime >= endDateTime) {
      throw new ValidationError('Data de início deve ser anterior à data de fim');
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDateTime,
        endDate: endDateTime,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_UPDATED', {
      contractId: id,
      updatedBy: userRole === UserRole.ADMIN ? 'admin' : 'owner',
    });

    res.json({
      success: true,
      message: 'Contrato atualizado com sucesso',
      data: { contract: updatedContract },
    });
  }

  // Ativar contrato
  async activate(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
        supplier: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && contract.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para ativar este contrato');
    }

    // Verificar se o contrato pode ser ativado
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ValidationError('Apenas contratos em rascunho podem ser ativados');
    }

    // Verificar se o contrato foi assinado (se implementado)
    if (!contract.signedAt) {
      throw new ValidationError('Contrato deve ser assinado antes de ser ativado');
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.ACTIVE,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_ACTIVATED', {
      contractId: id,
      contractNumber: contract.contractNumber,
    });

    res.json({
      success: true,
      message: 'Contrato ativado com sucesso',
      data: { contract: updatedContract },
    });
  }

  // Suspender contrato
  async suspend(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && contract.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para suspender este contrato');
    }

    // Verificar se o contrato pode ser suspenso
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ValidationError('Apenas contratos ativos podem ser suspensos');
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SUSPENDED,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_SUSPENDED', {
      contractId: id,
      contractNumber: contract.contractNumber,
      reason,
    });

    res.json({
      success: true,
      message: 'Contrato suspenso com sucesso',
      data: { contract: updatedContract },
    });
  }

  // Rescindir contrato
  async terminate(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && contract.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para rescindir este contrato');
    }

    // Verificar se o contrato pode ser rescindido
    if (contract.status === ContractStatus.TERMINATED || contract.status === ContractStatus.COMPLETED) {
      throw new ValidationError('Contrato já foi finalizado');
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.TERMINATED,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_TERMINATED', {
      contractId: id,
      contractNumber: contract.contractNumber,
      reason,
    });

    res.json({
      success: true,
      message: 'Contrato rescindido com sucesso',
      data: { contract: updatedContract },
    });
  }

  // Assinar contrato (ambos os lados)
  async sign(req: Request, res: Response) {
    const { id } = req.params;
    const { digitalSignature } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
        supplier: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    const canSign = (userRole === UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId) ||
                   (userRole === UserRole.SUPPLIER && contract.supplier.userId === userId) ||
                   userRole === UserRole.ADMIN;

    if (!canSign) {
      throw new AuthorizationError('Você não tem permissão para assinar este contrato');
    }

    // Verificar se o contrato pode ser assinado
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ValidationError('Apenas contratos em rascunho podem ser assinados');
    }

    // Simular assinatura digital (em um sistema real, isso seria mais complexo)
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        signedAt: new Date(),
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_SIGNED', {
      contractId: id,
      contractNumber: contract.contractNumber,
      signerRole: userRole,
    });

    res.json({
      success: true,
      message: 'Contrato assinado com sucesso',
      data: { contract: updatedContract },
    });
  }

  // Completar contrato (marcar como concluído)
  async complete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        publicEntity: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contrato não encontrado');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && contract.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para completar este contrato');
    }

    // Verificar se o contrato pode ser completado
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ValidationError('Apenas contratos ativos podem ser completados');
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.COMPLETED,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    logUserActivity(userId, 'CONTRACT_COMPLETED', {
      contractId: id,
      contractNumber: contract.contractNumber,
    });

    res.json({
      success: true,
      message: 'Contrato completado com sucesso',
      data: { contract: updatedContract },
    });
  }
}
