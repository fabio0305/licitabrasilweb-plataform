import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError
} from '@/middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '@/utils/logger';
import { UserRole, ProposalStatus, BiddingStatus } from '@prisma/client';
import NotificationService from '@/services/notificationService';

export class ProposalController {
  // Listar propostas (filtrada por usuário)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, status, biddingId } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros baseados no role do usuário
    const where: any = {};
    
    if (userRole === UserRole.SUPPLIER) {
      // Fornecedores veem apenas suas próprias propostas
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
            proposals: [],
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
      // Órgãos públicos veem propostas de suas licitações
      const publicEntity = await prisma.publicEntity.findUnique({
        where: { userId },
      });
      
      if (publicEntity) {
        where.bidding = {
          publicEntityId: publicEntity.id,
        };
      } else {
        return res.json({
          success: true,
          data: {
            proposals: [],
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
    // ADMIN vê todas as propostas (sem filtro adicional)
    
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { bidding: { title: { contains: search as string, mode: 'insensitive' } } },
        { supplier: { companyName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (biddingId) {
      where.biddingId = biddingId as string;
    }

    const startTime = Date.now();

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
                  id: true,
                  name: true,
                },
              },
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              tradeName: true,
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
          _count: {
            select: {
              items: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'proposals', Date.now() - startTime);

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

  // Obter proposta por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        bidding: {
          include: {
            publicEntity: {
              select: {
                id: true,
                name: true,
                userId: true,
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
        items: {
          orderBy: {
            createdAt: 'asc',
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

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    const canView = userRole === UserRole.ADMIN ||
                   (userRole === UserRole.SUPPLIER && proposal.supplier.userId === userId) ||
                   (userRole === UserRole.PUBLIC_ENTITY && proposal.bidding.publicEntity.userId === userId);

    if (!canView) {
      throw new AuthorizationError('Você não tem permissão para ver esta proposta');
    }

    res.json({
      success: true,
      data: { proposal },
    });
  }

  // Criar proposta
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      biddingId,
      description,
      validUntil,
      notes,
      items = [],
    } = req.body;

    // Buscar o perfil do fornecedor
    const supplier = await prisma.supplier.findUnique({
      where: { userId },
    });

    if (!supplier) {
      throw new ValidationError('Usuário não possui perfil de fornecedor');
    }

    // Buscar a licitação
    const bidding = await prisma.bidding.findUnique({
      where: { id: biddingId },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    // Verificar se a licitação está aberta para propostas
    if (bidding.status !== BiddingStatus.OPEN) {
      throw new ValidationError('Licitação não está aberta para propostas');
    }

    // Verificar se ainda está dentro do prazo
    const now = new Date();
    if (bidding.closingDate <= now) {
      throw new ValidationError('Prazo para submissão de propostas expirado');
    }

    // Verificar se o fornecedor já tem uma proposta para esta licitação
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        biddingId_supplierId: {
          biddingId,
          supplierId: supplier.id,
        },
      },
    });

    if (existingProposal) {
      throw new ConflictError('Fornecedor já possui uma proposta para esta licitação');
    }

    // Calcular valor total dos itens
    let totalValue = 0;
    const validatedItems = items.map((item: any) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      totalValue += itemTotal;
      return {
        ...item,
        totalPrice: itemTotal,
      };
    });

    // Validar data de validade
    const validUntilDate = new Date(validUntil);
    if (validUntilDate <= now) {
      throw new ValidationError('Data de validade deve ser futura');
    }

    const proposal = await prisma.proposal.create({
      data: {
        biddingId,
        supplierId: supplier.id,
        totalValue,
        description,
        validUntil: validUntilDate,
        notes,
        status: ProposalStatus.DRAFT,
        items: {
          create: validatedItems,
        },
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
        items: true,
      },
    });

    logUserActivity(userId, 'PROPOSAL_CREATED', { 
      proposalId: proposal.id,
      biddingId,
      totalValue,
    });

    res.status(201).json({
      success: true,
      message: 'Proposta criada com sucesso',
      data: { proposal },
    });
  }

  // Atualizar proposta
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const {
      description,
      validUntil,
      notes,
      items = [],
    } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        supplier: true,
        bidding: true,
        items: true,
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para editar esta proposta');
    }

    // Verificar se a proposta pode ser editada
    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ValidationError('Apenas propostas em rascunho podem ser editadas');
    }

    // Verificar se ainda está dentro do prazo da licitação
    const now = new Date();
    if (proposal.bidding.closingDate <= now) {
      throw new ValidationError('Prazo para edição de propostas expirado');
    }

    // Calcular novo valor total se itens foram fornecidos
    let totalValue = Number(proposal.totalValue);
    if (items.length > 0) {
      totalValue = 0;
      items.forEach((item: any) => {
        totalValue += Number(item.quantity) * Number(item.unitPrice);
      });
    }

    // Validar data de validade se fornecida
    let validUntilDate: Date | undefined;
    if (validUntil) {
      validUntilDate = new Date(validUntil);
      if (validUntilDate <= now) {
        throw new ValidationError('Data de validade deve ser futura');
      }
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        totalValue,
        description,
        validUntil: validUntilDate,
        notes,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
        items: true,
      },
    });

    // Atualizar itens se fornecidos
    if (items.length > 0) {
      // Remover itens existentes
      await prisma.proposalItem.deleteMany({
        where: { proposalId: id },
      });

      // Criar novos itens
      const validatedItems = items.map((item: any) => ({
        proposalId: id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        brand: item.brand,
        model: item.model,
      }));

      await prisma.proposalItem.createMany({
        data: validatedItems,
      });
    }

    logUserActivity(userId, 'PROPOSAL_UPDATED', {
      proposalId: id,
      updatedBy: userRole === UserRole.ADMIN ? 'admin' : 'owner',
    });

    res.json({
      success: true,
      message: 'Proposta atualizada com sucesso',
      data: { proposal: updatedProposal },
    });
  }

  // Submeter proposta
  async submit(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        supplier: true,
        bidding: true,
        items: true,
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para submeter esta proposta');
    }

    // Verificar se a proposta pode ser submetida
    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ValidationError('Apenas propostas em rascunho podem ser submetidas');
    }

    // Verificar se a licitação ainda está aberta
    if (proposal.bidding.status !== BiddingStatus.OPEN) {
      throw new ValidationError('Licitação não está mais aberta para propostas');
    }

    // Verificar se ainda está dentro do prazo
    const now = new Date();
    if (proposal.bidding.closingDate <= now) {
      throw new ValidationError('Prazo para submissão de propostas expirado');
    }

    // Verificar se a proposta tem itens
    if (proposal.items.length === 0) {
      throw new ValidationError('Proposta deve ter pelo menos um item');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
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

    logUserActivity(userId, 'PROPOSAL_SUBMITTED', {
      proposalId: id,
      biddingId: proposal.biddingId,
    });

    // Notificar órgão público sobre nova proposta
    const publicEntity = await prisma.publicEntity.findUnique({
      where: { id: proposal.bidding.publicEntityId },
    });

    if (publicEntity) {
      const notificationService = NotificationService.getInstance();
      await notificationService.notifyProposalReceived(
        publicEntity.userId,
        proposal.bidding.title,
        proposal.supplier.companyName,
        id
      );
    }

    res.json({
      success: true,
      message: 'Proposta submetida com sucesso',
      data: { proposal: updatedProposal },
    });
  }

  // Retirar proposta
  async withdraw(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        supplier: true,
        bidding: true,
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para retirar esta proposta');
    }

    // Verificar se a proposta pode ser retirada
    if (proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.UNDER_REVIEW) {
      throw new ValidationError('Proposta não pode ser retirada neste status');
    }

    // Verificar se a licitação ainda permite retirada
    if (proposal.bidding.status === BiddingStatus.CLOSED || proposal.bidding.status === BiddingStatus.AWARDED) {
      throw new ValidationError('Não é possível retirar proposta após fechamento da licitação');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.WITHDRAWN,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
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

    logUserActivity(userId, 'PROPOSAL_WITHDRAWN', {
      proposalId: id,
      reason,
    });

    res.json({
      success: true,
      message: 'Proposta retirada com sucesso',
      data: { proposal: updatedProposal },
    });
  }

  // Excluir proposta
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        supplier: true,
        contract: { select: { id: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.supplier.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para excluir esta proposta');
    }

    // Verificar se a proposta pode ser excluída
    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ValidationError('Apenas propostas em rascunho podem ser excluídas');
    }

    if (proposal.contract) {
      throw new ValidationError('Não é possível excluir proposta com contrato associado');
    }

    await prisma.proposal.delete({
      where: { id },
    });

    logUserActivity(userId, 'PROPOSAL_DELETED', {
      proposalId: id,
    });

    res.json({
      success: true,
      message: 'Proposta excluída com sucesso',
    });
  }

  // Avaliar proposta (órgão público)
  async evaluate(req: Request, res: Response) {
    const { id } = req.params;
    const { evaluation, score, notes } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        bidding: {
          include: {
            publicEntity: true,
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

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para avaliar esta proposta');
    }

    // Verificar se a proposta pode ser avaliada
    if (proposal.status !== ProposalStatus.SUBMITTED) {
      throw new ValidationError('Apenas propostas submetidas podem ser avaliadas');
    }

    // Verificar se a licitação está fechada
    if (proposal.bidding.status !== BiddingStatus.CLOSED) {
      throw new ValidationError('Propostas só podem ser avaliadas após fechamento da licitação');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.UNDER_REVIEW,
        // Aqui você poderia adicionar campos de avaliação no schema se necessário
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
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

    logUserActivity(userId, 'PROPOSAL_EVALUATED', {
      proposalId: id,
      evaluation,
      score,
    });

    res.json({
      success: true,
      message: 'Proposta avaliada com sucesso',
      data: { proposal: updatedProposal },
    });
  }

  // Aceitar proposta (órgão público)
  async accept(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        bidding: {
          include: {
            publicEntity: true,
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

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para aceitar esta proposta');
    }

    // Verificar se a proposta pode ser aceita
    if (proposal.status !== ProposalStatus.UNDER_REVIEW) {
      throw new ValidationError('Apenas propostas em avaliação podem ser aceitas');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.ACCEPTED,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
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

    // Atualizar status da licitação para AWARDED
    await prisma.bidding.update({
      where: { id: proposal.biddingId },
      data: {
        status: BiddingStatus.AWARDED,
      },
    });

    logUserActivity(userId, 'PROPOSAL_ACCEPTED', {
      proposalId: id,
      biddingId: proposal.biddingId,
    });

    res.json({
      success: true,
      message: 'Proposta aceita com sucesso',
      data: { proposal: updatedProposal },
    });
  }

  // Rejeitar proposta (órgão público)
  async reject(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        bidding: {
          include: {
            publicEntity: true,
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

    if (!proposal) {
      throw new NotFoundError('Proposta não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para rejeitar esta proposta');
    }

    // Verificar se a proposta pode ser rejeitada
    if (proposal.status !== ProposalStatus.UNDER_REVIEW) {
      throw new ValidationError('Apenas propostas em avaliação podem ser rejeitadas');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.REJECTED,
      },
      include: {
        bidding: {
          select: {
            id: true,
            title: true,
            biddingNumber: true,
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

    logUserActivity(userId, 'PROPOSAL_REJECTED', {
      proposalId: id,
      reason,
    });

    res.json({
      success: true,
      message: 'Proposta rejeitada com sucesso',
      data: { proposal: updatedProposal },
    });
  }
}
