"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireContractAccess = exports.requireProposalAccess = exports.requireBiddingAccess = exports.requireResourceOwnership = exports.requireCitizenProfile = exports.requirePublicEntityProfile = exports.requireSupplierProfile = exports.requireCompleteProfile = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const requireCompleteProfile = (requiredRole) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
        }
        const { userId, role } = req.user;
        if (role !== requiredRole) {
            return next(new errorHandler_1.ValidationError(`Perfil ${requiredRole} requerido`));
        }
        try {
            let hasCompleteProfile = false;
            switch (requiredRole) {
                case client_1.UserRole.SUPPLIER:
                    const supplier = await database_1.prisma.supplier.findUnique({
                        where: { userId },
                    });
                    hasCompleteProfile = !!supplier;
                    break;
                case client_1.UserRole.PUBLIC_ENTITY:
                    const publicEntity = await database_1.prisma.publicEntity.findUnique({
                        where: { userId },
                    });
                    hasCompleteProfile = !!publicEntity;
                    break;
                case client_1.UserRole.CITIZEN:
                    const citizen = await database_1.prisma.citizen.findUnique({
                        where: { userId },
                    });
                    hasCompleteProfile = !!citizen;
                    break;
                case client_1.UserRole.ADMIN:
                case client_1.UserRole.AUDITOR:
                    hasCompleteProfile = true;
                    break;
                default:
                    hasCompleteProfile = false;
            }
            if (!hasCompleteProfile) {
                return next(new errorHandler_1.ValidationError(`Perfil ${requiredRole} não encontrado. Complete seu cadastro primeiro.`));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireCompleteProfile = requireCompleteProfile;
exports.requireSupplierProfile = (0, exports.requireCompleteProfile)(client_1.UserRole.SUPPLIER);
exports.requirePublicEntityProfile = (0, exports.requireCompleteProfile)(client_1.UserRole.PUBLIC_ENTITY);
exports.requireCitizenProfile = (0, exports.requireCompleteProfile)(client_1.UserRole.CITIZEN);
const requireResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
        }
        const { userId, role } = req.user;
        const resourceId = req.params.id;
        if (role === client_1.UserRole.ADMIN) {
            return next();
        }
        try {
            let isOwner = false;
            switch (resourceType) {
                case 'supplier':
                    if (role === client_1.UserRole.SUPPLIER) {
                        const supplier = await database_1.prisma.supplier.findUnique({
                            where: { id: resourceId },
                            select: { userId: true },
                        });
                        isOwner = supplier?.userId === userId;
                    }
                    break;
                case 'publicEntity':
                    if (role === client_1.UserRole.PUBLIC_ENTITY) {
                        const publicEntity = await database_1.prisma.publicEntity.findUnique({
                            where: { id: resourceId },
                            select: { userId: true },
                        });
                        isOwner = publicEntity?.userId === userId;
                    }
                    break;
                case 'citizen':
                    if (role === client_1.UserRole.CITIZEN) {
                        const citizen = await database_1.prisma.citizen.findUnique({
                            where: { id: resourceId },
                            select: { userId: true },
                        });
                        isOwner = citizen?.userId === userId;
                    }
                    break;
            }
            if (!isOwner) {
                return next(new errorHandler_1.ValidationError('Você não tem permissão para acessar este recurso'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireResourceOwnership = requireResourceOwnership;
const requireBiddingAccess = async (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
    }
    const { userId, role } = req.user;
    const biddingId = req.params.id || req.params.biddingId;
    try {
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id: biddingId },
            include: {
                publicEntity: {
                    select: { userId: true },
                },
            },
        });
        if (!bidding) {
            return next(new errorHandler_1.ValidationError('Licitação não encontrada'));
        }
        if (role === client_1.UserRole.ADMIN || role === client_1.UserRole.AUDITOR) {
            return next();
        }
        if (role === client_1.UserRole.PUBLIC_ENTITY && bidding.publicEntity.userId === userId) {
            return next();
        }
        if ((role === client_1.UserRole.SUPPLIER || role === client_1.UserRole.CITIZEN) && bidding.isPublic) {
            return next();
        }
        return next(new errorHandler_1.ValidationError('Você não tem permissão para acessar esta licitação'));
    }
    catch (error) {
        next(error);
    }
};
exports.requireBiddingAccess = requireBiddingAccess;
const requireProposalAccess = async (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
    }
    const { userId, role } = req.user;
    const proposalId = req.params.id || req.params.proposalId;
    try {
        const proposal = await database_1.prisma.proposal.findUnique({
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
            return next(new errorHandler_1.ValidationError('Proposta não encontrada'));
        }
        if (role === client_1.UserRole.ADMIN || role === client_1.UserRole.AUDITOR) {
            return next();
        }
        if (role === client_1.UserRole.SUPPLIER && proposal.supplier.userId === userId) {
            return next();
        }
        if (role === client_1.UserRole.PUBLIC_ENTITY && proposal.bidding.publicEntity.userId === userId) {
            return next();
        }
        return next(new errorHandler_1.ValidationError('Você não tem permissão para acessar esta proposta'));
    }
    catch (error) {
        next(error);
    }
};
exports.requireProposalAccess = requireProposalAccess;
const requireContractAccess = async (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
    }
    const { userId, role } = req.user;
    const contractId = req.params.id || req.params.contractId;
    try {
        const contract = await database_1.prisma.contract.findUnique({
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
            return next(new errorHandler_1.ValidationError('Contrato não encontrado'));
        }
        if (role === client_1.UserRole.ADMIN || role === client_1.UserRole.AUDITOR) {
            return next();
        }
        if (role === client_1.UserRole.SUPPLIER && contract.supplier.userId === userId) {
            return next();
        }
        if (role === client_1.UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId) {
            return next();
        }
        if (role === client_1.UserRole.CITIZEN) {
            return next();
        }
        return next(new errorHandler_1.ValidationError('Você não tem permissão para acessar este contrato'));
    }
    catch (error) {
        next(error);
    }
};
exports.requireContractAccess = requireContractAccess;
//# sourceMappingURL=profileCheck.js.map