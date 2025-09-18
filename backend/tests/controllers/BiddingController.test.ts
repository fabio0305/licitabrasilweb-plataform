import { BiddingController } from '@/controllers/BiddingController';
import { prisma } from '@/config/database';
import { mockRequest, mockResponse, mockBidding, mockPublicEntity } from '../setup';
import { NotFoundError, AuthorizationError, ValidationError } from '@/middleware/errorHandler';

describe('BiddingController', () => {
  let biddingController: BiddingController;

  beforeEach(() => {
    biddingController = new BiddingController();
  });

  describe('listPublic', () => {
    it('should return public list of biddings', async () => {
      const req = mockRequest({
        query: { page: '1', limit: '10' },
      });
      const res = mockResponse();

      const mockBiddings = [{ ...mockBidding, status: 'OPEN' }];
      (prisma.bidding.findMany as jest.Mock).mockResolvedValue(mockBiddings);
      (prisma.bidding.count as jest.Mock).mockResolvedValue(1);

      await biddingController.listPublic(req, res);

      expect(prisma.bidding.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['PUBLISHED', 'OPEN', 'CLOSED'] },
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          biddings: mockBiddings,
          pagination: expect.any(Object),
        },
      });
    });

    it('should filter biddings by status', async () => {
      const req = mockRequest({
        query: { status: 'OPEN' },
      });
      const res = mockResponse();

      (prisma.bidding.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.bidding.count as jest.Mock).mockResolvedValue(0);

      await biddingController.listPublic(req, res);

      expect(prisma.bidding.findMany).toHaveBeenCalledWith({
        where: {
          status: 'OPEN',
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new bidding', async () => {
      const req = mockRequest({
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: {
          title: 'New Bidding',
          description: 'Test Description',
          openingDate: '2024-12-31T10:00:00Z',
          closingDate: '2025-01-15T18:00:00Z',
          estimatedValue: 100000,
          categoryIds: ['category-1', 'category-2'],
          items: [
            {
              description: 'Item 1',
              quantity: 10,
              unit: 'UN',
              estimatedUnitPrice: 100,
            },
          ],
        },
      });
      const res = mockResponse();

      const newBidding = { ...mockBidding, title: 'New Bidding' };

      (prisma.publicEntity.findUnique as jest.Mock).mockResolvedValue(mockPublicEntity);
      (prisma.bidding.create as jest.Mock).mockResolvedValue(newBidding);

      await biddingController.create(req, res);

      expect(prisma.bidding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Bidding',
          description: 'Test Description',
          publicEntityId: mockPublicEntity.id,
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Licitação criada com sucesso',
        data: { bidding: newBidding },
      });
    });

    it('should throw ValidationError when opening date is in the past', async () => {
      const req = mockRequest({
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: {
          title: 'New Bidding',
          description: 'Test Description',
          openingDate: '2020-01-01T10:00:00Z', // Data no passado
          closingDate: '2025-01-15T18:00:00Z',
        },
      });
      const res = mockResponse();

      (prisma.publicEntity.findUnique as jest.Mock).mockResolvedValue(mockPublicEntity);

      await expect(biddingController.create(req, res)).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('should update bidding when user is owner', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: {
          title: 'Updated Bidding',
          description: 'Updated Description',
        },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        publicEntity: mockPublicEntity,
      };
      const updatedBidding = { ...biddingWithEntity, title: 'Updated Bidding' };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);
      (prisma.bidding.update as jest.Mock).mockResolvedValue(updatedBidding);

      await biddingController.update(req, res);

      expect(prisma.bidding.update).toHaveBeenCalledWith({
        where: { id: 'bidding-id-123' },
        data: expect.objectContaining({
          title: 'Updated Bidding',
          description: 'Updated Description',
        }),
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Licitação atualizada com sucesso',
        data: { bidding: updatedBidding },
      });
    });

    it('should throw AuthorizationError when user is not owner', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'different-user-id', role: 'PUBLIC_ENTITY' },
        body: { title: 'Updated Bidding' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        publicEntity: mockPublicEntity,
      };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);

      await expect(biddingController.update(req, res)).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError when bidding is not in editable status', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: { title: 'Updated Bidding' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        status: 'CLOSED', // Status não editável
        publicEntity: mockPublicEntity,
      };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);

      await expect(biddingController.update(req, res)).rejects.toThrow(ValidationError);
    });
  });

  describe('publish', () => {
    it('should publish bidding when user is owner', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        status: 'DRAFT',
        publicEntity: mockPublicEntity,
        items: [{ id: 'item-1', description: 'Test Item' }],
      };
      const publishedBidding = { ...biddingWithEntity, status: 'PUBLISHED' };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);
      (prisma.bidding.update as jest.Mock).mockResolvedValue(publishedBidding);

      await biddingController.publish(req, res);

      expect(prisma.bidding.update).toHaveBeenCalledWith({
        where: { id: 'bidding-id-123' },
        data: { status: 'PUBLISHED' },
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Licitação publicada com sucesso',
        data: { bidding: publishedBidding },
      });
    });

    it('should throw ValidationError when bidding has no items', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        status: 'DRAFT',
        publicEntity: mockPublicEntity,
        items: [], // Sem itens
      };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);

      await expect(biddingController.publish(req, res)).rejects.toThrow(ValidationError);
    });
  });

  describe('cancel', () => {
    it('should cancel bidding when user is owner', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: { reason: 'Test cancellation reason' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        status: 'PUBLISHED',
        publicEntity: mockPublicEntity,
      };
      const cancelledBidding = { ...biddingWithEntity, status: 'CANCELLED' };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);
      (prisma.bidding.update as jest.Mock).mockResolvedValue(cancelledBidding);

      await biddingController.cancel(req, res);

      expect(prisma.bidding.update).toHaveBeenCalledWith({
        where: { id: 'bidding-id-123' },
        data: { status: 'CANCELLED' },
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Licitação cancelada com sucesso',
        data: { bidding: cancelledBidding },
      });
    });

    it('should throw ValidationError when bidding cannot be cancelled', async () => {
      const req = mockRequest({
        params: { id: 'bidding-id-123' },
        user: { userId: 'user-id-123', role: 'PUBLIC_ENTITY' },
        body: { reason: 'Test reason' },
      });
      const res = mockResponse();

      const biddingWithEntity = {
        ...mockBidding,
        status: 'CLOSED', // Status que não pode ser cancelado
        publicEntity: mockPublicEntity,
      };

      (prisma.bidding.findUnique as jest.Mock).mockResolvedValue(biddingWithEntity);

      await expect(biddingController.cancel(req, res)).rejects.toThrow(ValidationError);
    });
  });
});
