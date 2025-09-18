/**
 * @swagger
 * tags:
 *   name: Biddings
 *   description: Gerenciamento de licitações
 */

import { Router } from 'express';
import { authenticate, requirePublicEntityAccess, optionalAuth } from '@/middleware/auth';
import { validateBidding, validatePagination, validateUuidParam } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { BiddingController } from '@/controllers/BiddingController';

const router = Router();
const biddingController = new BiddingController();

/**
 * @swagger
 * /biddings/public:
 *   get:
 *     summary: Lista licitações públicas
 *     description: Retorna uma lista paginada de licitações públicas disponíveis
 *     tags: [Biddings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PUBLISHED, OPEN, CLOSED]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de licitações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         biddings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Bidding'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Rotas públicas (sem autenticação obrigatória)
router.get('/public', optionalAuth, validatePagination, asyncHandler(biddingController.listPublic));
router.get('/public/:id', optionalAuth, validateUuidParam, asyncHandler(biddingController.getPublicById));

// Todas as outras rotas requerem autenticação
router.use(authenticate);

// Rotas gerais (com autenticação)
router.get('/', validatePagination, asyncHandler(biddingController.list));
router.get('/:id', validateUuidParam, asyncHandler(biddingController.getById));

// Rotas para órgãos públicos
router.post('/', requirePublicEntityAccess, validateBidding, asyncHandler(biddingController.create));
router.put('/:id', requirePublicEntityAccess, validateUuidParam, validateBidding, asyncHandler(biddingController.update));
router.put('/:id/publish', requirePublicEntityAccess, validateUuidParam, asyncHandler(biddingController.publish));
router.put('/:id/cancel', requirePublicEntityAccess, validateUuidParam, asyncHandler(biddingController.cancel));
router.delete('/:id', requirePublicEntityAccess, validateUuidParam, asyncHandler(biddingController.delete));

export default router;
