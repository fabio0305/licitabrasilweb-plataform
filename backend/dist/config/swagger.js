"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'LicitaBrasil Web API',
        version: '1.0.0',
        description: 'API completa para plataforma de licitações públicas brasileiras',
        contact: {
            name: 'Equipe LicitaBrasil',
            email: 'contato@licitabrasil.com.br',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:3001/api/v1',
            description: 'Servidor de Desenvolvimento',
        },
        {
            url: 'https://api.licitabrasil.com.br/v1',
            description: 'Servidor de Produção',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Token JWT para autenticação',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    message: {
                        type: 'string',
                        example: 'Mensagem de erro',
                    },
                    error: {
                        type: 'string',
                        example: 'Detalhes do erro',
                    },
                },
            },
            Success: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    message: {
                        type: 'string',
                        example: 'Operação realizada com sucesso',
                    },
                    data: {
                        type: 'object',
                        description: 'Dados retornados pela operação',
                    },
                },
            },
            Pagination: {
                type: 'object',
                properties: {
                    page: {
                        type: 'integer',
                        example: 1,
                    },
                    limit: {
                        type: 'integer',
                        example: 10,
                    },
                    total: {
                        type: 'integer',
                        example: 100,
                    },
                    totalPages: {
                        type: 'integer',
                        example: 10,
                    },
                    hasNext: {
                        type: 'boolean',
                        example: true,
                    },
                    hasPrev: {
                        type: 'boolean',
                        example: false,
                    },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'usuario@exemplo.com',
                    },
                    firstName: {
                        type: 'string',
                        example: 'João',
                    },
                    lastName: {
                        type: 'string',
                        example: 'Silva',
                    },
                    role: {
                        type: 'string',
                        enum: ['ADMIN', 'SUPPLIER', 'PUBLIC_ENTITY', 'AUDITOR'],
                        example: 'SUPPLIER',
                    },
                    isActive: {
                        type: 'boolean',
                        example: true,
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2023-01-01T00:00:00.000Z',
                    },
                },
            },
            Bidding: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                    },
                    title: {
                        type: 'string',
                        example: 'Licitação para Aquisição de Material de Escritório',
                    },
                    description: {
                        type: 'string',
                        example: 'Descrição detalhada da licitação...',
                    },
                    type: {
                        type: 'string',
                        enum: ['PREGAO', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'LEILAO', 'CONCURSO'],
                        example: 'PREGAO',
                    },
                    status: {
                        type: 'string',
                        enum: ['DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'CANCELLED', 'AWARDED'],
                        example: 'PUBLISHED',
                    },
                    openingDate: {
                        type: 'string',
                        format: 'date-time',
                    },
                    closingDate: {
                        type: 'string',
                        format: 'date-time',
                    },
                    estimatedValue: {
                        type: 'number',
                        format: 'decimal',
                        example: 50000.00,
                    },
                    publicEntityId: {
                        type: 'string',
                        format: 'uuid',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};
const options = {
    definition: swaggerDefinition,
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map