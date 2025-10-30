"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuditorProfile = exports.auditorProfileSchema = exports.validateCitizen = exports.citizenSchema = exports.validateDateRange = exports.validateUserList = exports.validatePagination = exports.validateUuidParam = exports.validateCategory = exports.validateContract = exports.validateProposal = exports.validateBidding = exports.validatePublicEntity = exports.validateSupplier = exports.validateLogin = exports.validateUserRegistration = exports.validateCpf = exports.categorySchema = exports.contractSchema = exports.proposalSchema = exports.biddingSchema = exports.publicEntitySchema = exports.supplierSchema = exports.loginSchema = exports.userRegistrationSchema = exports.cpfValidationSchema = exports.dateRangeSchema = exports.userListSchema = exports.paginationSchema = exports.zipCodeSchema = exports.phoneSchema = exports.cpfSchema = exports.cnpjSchema = exports.passwordSchema = exports.emailSchema = exports.uuidSchema = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("../middleware/errorHandler");
const cpfValidation_1 = require("../utils/cpfValidation");
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (schema.headers) {
            const { error } = schema.headers.validate(req.headers, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (errors.length > 0) {
            return next(new errorHandler_1.ValidationError('Dados inválidos', errors));
        }
        next();
    };
};
exports.validate = validate;
exports.uuidSchema = joi_1.default.string().uuid().required();
exports.emailSchema = joi_1.default.string().email().required();
exports.passwordSchema = joi_1.default.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
    'string.pattern.base': 'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    'string.min': 'A senha deve ter pelo menos 8 caracteres',
});
exports.cnpjSchema = joi_1.default.string()
    .pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .required()
    .messages({
    'string.pattern.base': 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
});
exports.cpfSchema = joi_1.default.string()
    .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .custom((value, helpers) => {
    if (!(0, cpfValidation_1.isValidCpf)(value)) {
        return helpers.error('cpf.invalid');
    }
    return value;
})
    .required()
    .messages({
    'string.pattern.base': 'CPF deve estar no formato XXX.XXX.XXX-XX',
    'cpf.invalid': 'CPF inválido segundo algoritmo da Receita Federal',
});
exports.phoneSchema = joi_1.default.string()
    .pattern(/^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$/)
    .required()
    .messages({
    'string.pattern.base': 'Telefone deve estar no formato (XX) 9 XXXX-XXXX',
});
exports.zipCodeSchema = joi_1.default.string()
    .pattern(/^\d{5}-\d{3}$/)
    .required()
    .messages({
    'string.pattern.base': 'CEP deve estar no formato XXXXX-XXX',
});
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc'),
});
exports.userListSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string().optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc'),
    search: joi_1.default.string().optional(),
    role: joi_1.default.string().valid('ADMIN', 'SUPPLIER', 'PUBLIC_ENTITY', 'AUDITOR', 'CITIZEN').optional(),
    status: joi_1.default.string().valid('ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED').optional(),
});
exports.dateRangeSchema = joi_1.default.object({
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
});
exports.cpfValidationSchema = joi_1.default.object({
    cpf: exports.cpfSchema,
});
exports.userRegistrationSchema = joi_1.default.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    firstName: joi_1.default.string().min(2).max(50).required(),
    lastName: joi_1.default.string().min(2).max(50).required(),
    phone: exports.phoneSchema.required(),
    role: joi_1.default.string().valid('SUPPLIER', 'PUBLIC_ENTITY', 'CITIZEN', 'AUDITOR').required(),
    cpf: exports.cpfSchema.optional(),
}).unknown(true);
exports.loginSchema = joi_1.default.object({
    email: exports.emailSchema,
    password: joi_1.default.string().required(),
});
exports.supplierSchema = joi_1.default.object({
    companyName: joi_1.default.string().min(2).max(200).required(),
    tradeName: joi_1.default.string().min(2).max(200).optional(),
    cnpj: exports.cnpjSchema,
    stateRegistration: joi_1.default.string().optional(),
    municipalRegistration: joi_1.default.string().optional(),
    address: joi_1.default.string().min(5).max(500).required(),
    city: joi_1.default.string().min(2).max(100).required(),
    state: joi_1.default.string().length(2).required(),
    zipCode: exports.zipCodeSchema,
    phone: exports.phoneSchema.required(),
    website: joi_1.default.string().uri().optional(),
    description: joi_1.default.string().max(1000).optional(),
    categories: joi_1.default.array().items(joi_1.default.string().min(1).max(100)).min(1).required(),
});
exports.publicEntitySchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(200).required(),
    cnpj: exports.cnpjSchema,
    entityType: joi_1.default.string().valid('Municipal', 'Estadual', 'Federal').required(),
    sphere: joi_1.default.string().valid('Executivo', 'Legislativo', 'Judiciário').required(),
    address: joi_1.default.string().min(5).max(500).required(),
    city: joi_1.default.string().min(2).max(100).required(),
    state: joi_1.default.string().length(2).required(),
    zipCode: exports.zipCodeSchema,
    phone: exports.phoneSchema.required(),
    website: joi_1.default.string().uri().optional(),
    legalRepresentativeName: joi_1.default.string().min(2).max(100).required(),
    legalRepresentativeCpf: exports.cpfSchema.required(),
    legalRepresentativePosition: joi_1.default.string().min(2).max(100).required(),
});
exports.biddingSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(200).required(),
    description: joi_1.default.string().min(10).max(5000).required(),
    type: joi_1.default.string().valid('PREGAO_ELETRONICO', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'CONCURSO', 'LEILAO').required(),
    estimatedValue: joi_1.default.number().positive().required(),
    openingDate: joi_1.default.date().iso().min('now').required(),
    closingDate: joi_1.default.date().iso().min(joi_1.default.ref('openingDate')).required(),
    deliveryLocation: joi_1.default.string().min(5).max(500).required(),
    deliveryDeadline: joi_1.default.date().iso().min(joi_1.default.ref('closingDate')).required(),
    requirements: joi_1.default.string().min(10).max(5000).required(),
    evaluationCriteria: joi_1.default.string().min(10).max(5000).required(),
    categoryIds: joi_1.default.array().items(exports.uuidSchema).min(1).required(),
});
exports.proposalSchema = joi_1.default.object({
    totalValue: joi_1.default.number().positive().required(),
    description: joi_1.default.string().min(10).max(5000).required(),
    validUntil: joi_1.default.date().iso().min('now').required(),
    notes: joi_1.default.string().max(1000).optional(),
    items: joi_1.default.array().items(joi_1.default.object({
        description: joi_1.default.string().min(2).max(500).required(),
        quantity: joi_1.default.number().integer().positive().required(),
        unitPrice: joi_1.default.number().positive().required(),
        brand: joi_1.default.string().max(100).optional(),
        model: joi_1.default.string().max(100).optional(),
    })).min(1).required(),
});
exports.contractSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(200).required(),
    description: joi_1.default.string().min(10).max(5000).required(),
    totalValue: joi_1.default.number().positive().required(),
    startDate: joi_1.default.date().iso().min('now').required(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required(),
});
exports.categorySchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(500).optional(),
    code: joi_1.default.string().min(2).max(20).required(),
    parentId: exports.uuidSchema.optional(),
});
exports.validateCpf = (0, exports.validate)({
    body: exports.cpfValidationSchema,
});
exports.validateUserRegistration = (0, exports.validate)({
    body: exports.userRegistrationSchema,
});
exports.validateLogin = (0, exports.validate)({
    body: exports.loginSchema,
});
exports.validateSupplier = (0, exports.validate)({
    body: exports.supplierSchema,
});
exports.validatePublicEntity = (0, exports.validate)({
    body: exports.publicEntitySchema,
});
exports.validateBidding = (0, exports.validate)({
    body: exports.biddingSchema,
});
exports.validateProposal = (0, exports.validate)({
    body: exports.proposalSchema,
});
exports.validateContract = (0, exports.validate)({
    body: exports.contractSchema,
});
exports.validateCategory = (0, exports.validate)({
    body: exports.categorySchema,
});
exports.validateUuidParam = (0, exports.validate)({
    params: joi_1.default.object({
        id: exports.uuidSchema,
    }),
});
exports.validatePagination = (0, exports.validate)({
    query: exports.paginationSchema,
});
exports.validateUserList = (0, exports.validate)({
    query: exports.userListSchema,
});
exports.validateDateRange = (0, exports.validate)({
    query: exports.dateRangeSchema,
});
exports.citizenSchema = joi_1.default.object({
    cpf: exports.cpfSchema.required(),
    dateOfBirth: joi_1.default.date().max('now').required(),
    profession: joi_1.default.string().min(2).max(100).optional(),
    address: joi_1.default.string().min(5).max(500).optional(),
    city: joi_1.default.string().min(2).max(100).optional(),
    state: joi_1.default.string().length(2).optional(),
    zipCode: exports.zipCodeSchema.optional(),
    interests: joi_1.default.array().items(joi_1.default.string().min(1).max(100)).min(1).required(),
});
exports.validateCitizen = (0, exports.validate)({
    body: exports.citizenSchema,
});
exports.auditorProfileSchema = joi_1.default.object({
    cpf: exports.cpfSchema.required(),
    institution: joi_1.default.string().min(2).max(200).required(),
    professionalRegistry: joi_1.default.string().min(3).max(50).required(),
    specialization: joi_1.default.string().min(2).max(100).required(),
    professionalPhone: exports.phoneSchema.required(),
    profileCompleted: joi_1.default.boolean().optional(),
});
exports.validateAuditorProfile = (0, exports.validate)({
    body: exports.auditorProfileSchema,
});
//# sourceMappingURL=validation.js.map