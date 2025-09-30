import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticationError, ValidationError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

// Middleware para verificar se o usuário tem perfil completo
export const requireCompleteProfile = (requiredRole: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Usuário não autenticado'));
    }

    const { userId, role } = req.user;

    if (role !== requiredRole) {
      return next(new ValidationError(`Perfil ${requiredRole} requerido`));
    }

    try {
      let hasCompleteProfile = false;

      switch (requiredRole) {
        case UserRole.SUPPLIER:
          const supplier = await prisma.supplier.findUnique({
            where: { userId },
          });
          hasCompleteProfile = !!supplier;
          break;

        case UserRole.PUBLIC_ENTITY:
          const publicEntity = await prisma.publicEntity.findUnique({
            where: { userId },
          });
          hasCompleteProfile = !!publicEntity;
          break;

        case UserRole.CITIZEN:
          const citizen = await prisma.citizen.findUnique({
            where: { userId },
          });
          hasCompleteProfile = !!citizen;
          break;

        case UserRole.ADMIN:
        case UserRole.AUDITOR:
          hasCompleteProfile = true; // Admin e Auditor não precisam de perfil adicional
          break;

        default:
          hasCompleteProfile = false;
      }

      if (!hasCompleteProfile) {
        return next(new ValidationError(`Perfil ${requiredRole} não encontrado. Complete seu cadastro primeiro.`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware específicos para cada perfil
export const requireSupplierProfile = requireCompleteProfile(UserRole.SUPPLIER);
export const requirePublicEntityProfile = requireCompleteProfile(UserRole.PUBLIC_ENTITY);
export const requireCitizenProfile = requireCompleteProfile(UserRole.CITIZEN);

// Middleware para verificar se o usuário pode acessar um recurso específico
export const requireResourceOwnership = (resourceType: 'supplier' | 'publicEntity' | 'citizen') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Usuário não autenticado'));
    }

    const { userId, role } = req.user;
    const resourceId = req.params.id;

    // Admin pode acessar qualquer recurso
    if (role === UserRole.ADMIN) {
      return next();
    }

    try {
      let isOwner = false;

      switch (resourceType) {
        case 'supplier':
          if (role === UserRole.SUPPLIER) {
            const supplier = await prisma.supplier.findUnique({
              where: { id: resourceId },
              select: { userId: true },
            });
            isOwner = supplier?.userId === userId;
          }
          break;

        case 'publicEntity':
          if (role === UserRole.PUBLIC_ENTITY) {
            const publicEntity = await prisma.publicEntity.findUnique({
              where: { id: resourceId },
              select: { userId: true },
            });
            isOwner = publicEntity?.userId === userId;
          }
          break;

        case 'citizen':
          if (role === UserRole.CITIZEN) {
            const citizen = await prisma.citizen.findUnique({
              where: { id: resourceId },
              select: { userId: true },
            });
            isOwner = citizen?.userId === userId;
          }
          break;
      }

      if (!isOwner) {
        return next(new ValidationError('Você não tem permissão para acessar este recurso'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar se o usuário pode acessar dados de uma licitação
export const requireBiddingAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError('Usuário não autenticado'));
  }

  const { userId, role } = req.user;
  const biddingId = req.params.id || req.params.biddingId;

  try {
    const bidding = await prisma.bidding.findUnique({
      where: { id: biddingId },
      include: {
        publicEntity: {
          select: { userId: true },
        },
      },
    });

    if (!bidding) {
      return next(new ValidationError('Licitação não encontrada'));
    }

    // Admin pode acessar qualquer licitação
    if (role === UserRole.ADMIN || role === UserRole.AUDITOR) {
      return next();
    }

    // Órgão público pode acessar suas próprias licitações
    if (role === UserRole.PUBLIC_ENTITY && bidding.publicEntity.userId === userId) {
      return next();
    }

    // Fornecedores e cidadãos só podem acessar licitações públicas
    if ((role === UserRole.SUPPLIER || role === UserRole.CITIZEN) && bidding.isPublic) {
      return next();
    }

    return next(new ValidationError('Você não tem permissão para acessar esta licitação'));
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar se o usuário pode acessar dados de uma proposta
export const requireProposalAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError('Usuário não autenticado'));
  }

  const { userId, role } = req.user;
  const proposalId = req.params.id || req.params.proposalId;

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        supplier: {
          select: { userId: true },
        },
        bidding: {
          include: {
            publicEntity: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!proposal) {
      return next(new ValidationError('Proposta não encontrada'));
    }

    // Admin pode acessar qualquer proposta
    if (role === UserRole.ADMIN || role === UserRole.AUDITOR) {
      return next();
    }

    // Fornecedor pode acessar suas próprias propostas
    if (role === UserRole.SUPPLIER && proposal.supplier.userId === userId) {
      return next();
    }

    // Órgão público pode acessar propostas de suas licitações
    if (role === UserRole.PUBLIC_ENTITY && proposal.bidding.publicEntity.userId === userId) {
      return next();
    }

    return next(new ValidationError('Você não tem permissão para acessar esta proposta'));
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar se o usuário pode acessar dados de um contrato
export const requireContractAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError('Usuário não autenticado'));
  }

  const { userId, role } = req.user;
  const contractId = req.params.id || req.params.contractId;

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        supplier: {
          select: { userId: true },
        },
        publicEntity: {
          select: { userId: true },
        },
      },
    });

    if (!contract) {
      return next(new ValidationError('Contrato não encontrado'));
    }

    // Admin pode acessar qualquer contrato
    if (role === UserRole.ADMIN || role === UserRole.AUDITOR) {
      return next();
    }

    // Fornecedor pode acessar seus próprios contratos
    if (role === UserRole.SUPPLIER && contract.supplier.userId === userId) {
      return next();
    }

    // Órgão público pode acessar seus próprios contratos
    if (role === UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId) {
      return next();
    }

    // Cidadãos podem acessar contratos públicos (assumindo que todos são públicos por transparência)
    if (role === UserRole.CITIZEN) {
      return next();
    }

    return next(new ValidationError('Você não tem permissão para acessar este contrato'));
  } catch (error) {
    next(error);
  }
};
