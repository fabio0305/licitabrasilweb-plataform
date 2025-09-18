import { SupplierController } from '@/controllers/SupplierController';
import { prisma } from '@/config/database';
import { mockRequest, mockResponse, mockUser, mockSupplier } from '../setup';
import { NotFoundError, AuthorizationError, ConflictError } from '@/middleware/errorHandler';

describe('SupplierController', () => {
  let supplierController: SupplierController;

  beforeEach(() => {
    supplierController = new SupplierController();
  });

  describe('list', () => {
    it('should return paginated list of suppliers', async () => {
      const req = mockRequest({
        query: { page: '1', limit: '10' },
      });
      const res = mockResponse();

      const mockSuppliers = [mockSupplier];
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);
      (prisma.supplier.count as jest.Mock).mockResolvedValue(1);

      await supplierController.list(req, res);

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          suppliers: mockSuppliers,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    });

    it('should filter suppliers by search query', async () => {
      const req = mockRequest({
        query: { search: 'Test Company' },
      });
      const res = mockResponse();

      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.supplier.count as jest.Mock).mockResolvedValue(0);

      await supplierController.list(req, res);

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { companyName: { contains: 'Test Company', mode: 'insensitive' } },
            { cnpj: { contains: 'Test Company', mode: 'insensitive' } },
            { email: { contains: 'Test Company', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getById', () => {
    it('should return supplier by id', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
      });
      const res = mockResponse();

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);

      await supplierController.getById(req, res);

      expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: 'supplier-id-123' },
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { supplier: mockSupplier },
      });
    });

    it('should throw NotFoundError when supplier does not exist', async () => {
      const req = mockRequest({
        params: { id: 'non-existent-id' },
      });
      const res = mockResponse();

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(supplierController.getById(req, res)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const req = mockRequest({
        body: {
          companyName: 'New Company',
          cnpj: '98765432109876',
          email: 'new@company.com',
          phone: '11999999999',
          address: 'Test Address',
          city: 'Test City',
          state: 'SP',
          zipCode: '12345678',
        },
      });
      const res = mockResponse();

      const newSupplier = { ...mockSupplier, companyName: 'New Company' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.create as jest.Mock).mockResolvedValue(newSupplier);

      await supplierController.create(req, res);

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: 'New Company',
          cnpj: '98765432109876',
          userId: 'user-id-123',
        }),
        include: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Fornecedor criado com sucesso',
        data: { supplier: newSupplier },
      });
    });

    it('should throw ConflictError when CNPJ already exists', async () => {
      const req = mockRequest({
        body: {
          companyName: 'New Company',
          cnpj: '12345678901234', // CNPJ já existente
          email: 'new@company.com',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);

      await expect(supplierController.create(req, res)).rejects.toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should update supplier when user is owner', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
        body: {
          companyName: 'Updated Company',
          phone: '11888888888',
        },
      });
      const res = mockResponse();

      const updatedSupplier = { ...mockSupplier, companyName: 'Updated Company' };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.supplier.update as jest.Mock).mockResolvedValue(updatedSupplier);

      await supplierController.update(req, res);

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-id-123' },
        data: expect.objectContaining({
          companyName: 'Updated Company',
          phone: '11888888888',
        }),
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Fornecedor atualizado com sucesso',
        data: { supplier: updatedSupplier },
      });
    });

    it('should throw AuthorizationError when user is not owner', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
        user: { userId: 'different-user-id', role: 'SUPPLIER' },
        body: { companyName: 'Updated Company' },
      });
      const res = mockResponse();

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);

      await expect(supplierController.update(req, res)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('verify', () => {
    it('should verify supplier when user is admin', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
        user: { userId: 'admin-id', role: 'ADMIN' },
      });
      const res = mockResponse();

      const verifiedSupplier = { ...mockSupplier, verifiedAt: new Date() };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.supplier.update as jest.Mock).mockResolvedValue(verifiedSupplier);

      await supplierController.verify(req, res);

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-id-123' },
        data: { verifiedAt: expect.any(Date) },
        include: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Fornecedor verificado com sucesso',
        data: { supplier: verifiedSupplier },
      });
    });

    it('should throw AuthorizationError when user is not admin', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
        user: { userId: 'user-id', role: 'SUPPLIER' },
      });
      const res = mockResponse();

      await expect(supplierController.verify(req, res)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('delete', () => {
    it('should delete supplier when user is owner', async () => {
      const req = mockRequest({
        params: { id: 'supplier-id-123' },
      });
      const res = mockResponse();

      const supplierWithoutAssociations = {
        ...mockSupplier,
        proposals: [],
        contracts: [],
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(supplierWithoutAssociations);
      (prisma.supplier.delete as jest.Mock).mockResolvedValue(mockSupplier);

      await supplierController.delete(req, res);

      expect(prisma.supplier.delete).toHaveBeenCalledWith({
        where: { id: 'supplier-id-123' },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Fornecedor excluído com sucesso',
      });
    });
  });
});
