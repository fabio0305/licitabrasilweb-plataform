import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/middleware/errorHandler';

// Interface para opções de validação
interface ValidationOptions {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

// Middleware de validação genérico
export const validate = (schema: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validar body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validar query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validar route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validar headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Dados inválidos', errors));
    }

    next();
  };
};

// Schemas de validação comuns

// Schema para UUID
export const uuidSchema = Joi.string().uuid().required();

// Schema para email
export const emailSchema = Joi.string().email().required();

// Schema para senha
export const passwordSchema = Joi.string()
  .min(8)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.pattern.base': 'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    'string.min': 'A senha deve ter pelo menos 8 caracteres',
  });

// Schema para CNPJ
export const cnpjSchema = Joi.string()
  .pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
  .required()
  .messages({
    'string.pattern.base': 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  });

// Schema para CPF
export const cpfSchema = Joi.string()
  .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
  .required()
  .messages({
    'string.pattern.base': 'CPF deve estar no formato XXX.XXX.XXX-XX',
  });

// Schema para telefone
export const phoneSchema = Joi.string()
  .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
  .messages({
    'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  });

// Schema para CEP
export const zipCodeSchema = Joi.string()
  .pattern(/^\d{5}-\d{3}$/)
  .required()
  .messages({
    'string.pattern.base': 'CEP deve estar no formato XXXXX-XXX',
  });

// Schema para paginação
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Schema para filtros de data
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
});

// Schemas específicos para entidades

// Schema para registro de usuário
export const userRegistrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: phoneSchema.optional(),
  role: Joi.string().valid('SUPPLIER', 'PUBLIC_ENTITY').required(),
});

// Schema para login
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

// Schema para fornecedor
export const supplierSchema = Joi.object({
  companyName: Joi.string().min(2).max(200).required(),
  tradeName: Joi.string().min(2).max(200).optional(),
  cnpj: cnpjSchema,
  stateRegistration: Joi.string().optional(),
  municipalRegistration: Joi.string().optional(),
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().length(2).required(),
  zipCode: zipCodeSchema,
  website: Joi.string().uri().optional(),
  description: Joi.string().max(1000).optional(),
});

// Schema para órgão público
export const publicEntitySchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  cnpj: cnpjSchema,
  entityType: Joi.string().valid('Municipal', 'Estadual', 'Federal').required(),
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().length(2).required(),
  zipCode: zipCodeSchema,
  phone: phoneSchema.required(),
  website: Joi.string().uri().optional(),
});

// Schema para licitação
export const biddingSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  type: Joi.string().valid(
    'PREGAO_ELETRONICO',
    'CONCORRENCIA',
    'TOMADA_PRECOS',
    'CONVITE',
    'CONCURSO',
    'LEILAO'
  ).required(),
  estimatedValue: Joi.number().positive().required(),
  openingDate: Joi.date().iso().min('now').required(),
  closingDate: Joi.date().iso().min(Joi.ref('openingDate')).required(),
  deliveryLocation: Joi.string().min(5).max(500).required(),
  deliveryDeadline: Joi.date().iso().min(Joi.ref('closingDate')).required(),
  requirements: Joi.string().min(10).max(5000).required(),
  evaluationCriteria: Joi.string().min(10).max(5000).required(),
  categoryIds: Joi.array().items(uuidSchema).min(1).required(),
});

// Schema para proposta
export const proposalSchema = Joi.object({
  totalValue: Joi.number().positive().required(),
  description: Joi.string().min(10).max(5000).required(),
  validUntil: Joi.date().iso().min('now').required(),
  notes: Joi.string().max(1000).optional(),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().min(2).max(500).required(),
      quantity: Joi.number().integer().positive().required(),
      unitPrice: Joi.number().positive().required(),
      brand: Joi.string().max(100).optional(),
      model: Joi.string().max(100).optional(),
    })
  ).min(1).required(),
});

// Schema para contrato
export const contractSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  totalValue: Joi.number().positive().required(),
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
});

// Schema para categoria
export const categorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  code: Joi.string().min(2).max(20).required(),
  parentId: uuidSchema.optional(),
});

// Middleware específicos para validação

export const validateUserRegistration = validate({
  body: userRegistrationSchema,
});

export const validateLogin = validate({
  body: loginSchema,
});

export const validateSupplier = validate({
  body: supplierSchema,
});

export const validatePublicEntity = validate({
  body: publicEntitySchema,
});

export const validateBidding = validate({
  body: biddingSchema,
});

export const validateProposal = validate({
  body: proposalSchema,
});

export const validateContract = validate({
  body: contractSchema,
});

export const validateCategory = validate({
  body: categorySchema,
});

export const validateUuidParam = validate({
  params: Joi.object({
    id: uuidSchema,
  }),
});

export const validatePagination = validate({
  query: paginationSchema,
});

export const validateDateRange = validate({
  query: dateRangeSchema,
});
