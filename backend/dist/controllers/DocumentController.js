"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class DocumentController {
    async list(req, res) {
        const { page = 1, limit = 20, type, entityType, entityId } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userRole !== client_1.UserRole.ADMIN) {
            where.uploadedBy = userId;
        }
        if (type) {
            where.type = type;
        }
        if (entityType && entityId) {
            where.entityType = entityType;
            where.entityId = entityId;
        }
        const startTime = Date.now();
        const [documents, total] = await Promise.all([
            database_1.prisma.document.findMany({
                where,
                skip: offset,
                take: Number(limit),
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.document.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'documents', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                documents,
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
    async getById(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const document = await database_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new errorHandler_1.NotFoundError('Documento não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && document.uploadedBy !== userId) {
            const hasAccess = await this.checkDocumentAccess(document, userId, userRole);
            if (!hasAccess) {
                throw new errorHandler_1.AuthorizationError('Você não tem permissão para acessar este documento');
            }
        }
        res.json({
            success: true,
            data: { document },
        });
    }
    async upload(req, res) {
        const userId = req.user.userId;
        const { type, entityType, entityId, description } = req.body;
        if (!req.file) {
            throw new errorHandler_1.ValidationError('Nenhum arquivo foi enviado');
        }
        const file = req.file;
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new errorHandler_1.ValidationError('Tipo de arquivo não permitido');
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new errorHandler_1.ValidationError('Arquivo muito grande. Tamanho máximo: 10MB');
        }
        if (entityType && entityId) {
            const hasPermission = await this.checkEntityPermission(entityType, entityId, userId);
            if (!hasPermission) {
                throw new errorHandler_1.AuthorizationError('Você não tem permissão para associar documentos a esta entidade');
            }
        }
        const fileExtension = path_1.default.extname(file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
        const filePath = path_1.default.join('uploads', fileName);
        try {
            await promises_1.default.writeFile(filePath, file.buffer);
            const document = await database_1.prisma.document.create({
                data: {
                    filename: file.originalname,
                    originalName: file.originalname,
                    path: filePath,
                    size: file.size,
                    mimeType: file.mimetype,
                    type: type || 'OTHER',
                    description,
                    uploadedBy: userId,
                },
            });
            (0, logger_1.logUserActivity)(userId, 'DOCUMENT_UPLOADED', {
                documentId: document.id,
                fileName: file.originalname,
                fileSize: file.size,
                entityType,
                entityId,
            });
            res.status(201).json({
                success: true,
                message: 'Documento enviado com sucesso',
                data: { document },
            });
        }
        catch (error) {
            try {
                await promises_1.default.unlink(filePath);
            }
            catch (unlinkError) {
                console.error('Erro ao remover arquivo:', unlinkError);
            }
            throw error;
        }
    }
    async download(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const document = await database_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new errorHandler_1.NotFoundError('Documento não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && document.uploadedBy !== userId) {
            const hasAccess = await this.checkDocumentAccess(document, userId, userRole);
            if (!hasAccess) {
                throw new errorHandler_1.AuthorizationError('Você não tem permissão para baixar este documento');
            }
        }
        try {
            await promises_1.default.access(document.path);
            (0, logger_1.logUserActivity)(userId, 'DOCUMENT_DOWNLOADED', {
                documentId: id,
                fileName: document.filename,
            });
            res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
            res.setHeader('Content-Type', document.mimeType);
            res.sendFile(path_1.default.resolve(document.path));
        }
        catch (error) {
            throw new errorHandler_1.NotFoundError('Arquivo não encontrado no sistema');
        }
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const document = await database_1.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new errorHandler_1.NotFoundError('Documento não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && document.uploadedBy !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para excluir este documento');
        }
        try {
            await promises_1.default.unlink(document.path);
        }
        catch (error) {
            console.error('Erro ao remover arquivo:', error);
        }
        await database_1.prisma.document.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'DOCUMENT_DELETED', {
            documentId: id,
            fileName: document.filename,
        });
        res.json({
            success: true,
            message: 'Documento excluído com sucesso',
        });
    }
    async checkDocumentAccess(document, userId, userRole) {
        if (!document.entityType || !document.entityId) {
            return false;
        }
        switch (document.entityType) {
            case 'BIDDING':
                const bidding = await database_1.prisma.bidding.findUnique({
                    where: { id: document.entityId },
                    include: {
                        publicEntity: true,
                        proposals: {
                            where: { supplier: { userId } },
                            select: { id: true },
                        },
                    },
                });
                return bidding?.publicEntity.userId === userId || bidding?.proposals.length > 0;
            case 'PROPOSAL':
                const proposal = await database_1.prisma.proposal.findUnique({
                    where: { id: document.entityId },
                    include: {
                        supplier: true,
                        bidding: {
                            include: { publicEntity: true },
                        },
                    },
                });
                return proposal?.supplier.userId === userId || proposal?.bidding.publicEntity.userId === userId;
            case 'CONTRACT':
                const contract = await database_1.prisma.contract.findUnique({
                    where: { id: document.entityId },
                    include: {
                        publicEntity: true,
                        supplier: true,
                    },
                });
                return contract?.publicEntity.userId === userId || contract?.supplier.userId === userId;
            default:
                return false;
        }
    }
    async checkEntityPermission(entityType, entityId, userId) {
        switch (entityType) {
            case 'BIDDING':
                const bidding = await database_1.prisma.bidding.findUnique({
                    where: { id: entityId },
                    include: { publicEntity: true },
                });
                return bidding?.publicEntity.userId === userId;
            case 'PROPOSAL':
                const proposal = await database_1.prisma.proposal.findUnique({
                    where: { id: entityId },
                    include: { supplier: true },
                });
                return proposal?.supplier.userId === userId;
            case 'CONTRACT':
                const contract = await database_1.prisma.contract.findUnique({
                    where: { id: entityId },
                    include: {
                        publicEntity: true,
                        supplier: true,
                    },
                });
                return contract?.publicEntity.userId === userId || contract?.supplier.userId === userId;
            default:
                return false;
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=DocumentController.js.map