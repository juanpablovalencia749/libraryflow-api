import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BooksService', () => {
  let service: BooksService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            reservation: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            loan: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a book', async () => {
      const dto = { title: 'Test', author: 'Author', publicationYear: 2020 };
      prisma.book.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as any, 1);
      expect(result.id).toBe(1);
      expect(prisma.book.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated books with enrichment', async () => {
      const query = { page: 1, limit: 10, sortBy: 'title', order: 'asc' };
      prisma.book.count.mockResolvedValue(1);
      prisma.book.findMany.mockResolvedValue([{ id: 1, title: 'Test' }]);
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.loan.findMany.mockResolvedValue([]);

      const result = await service.findAll(query as any, 1);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a book if found', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, title: 'Test' });
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.loan.findFirst.mockResolvedValue(null);

      const result = await service.findOne(1, 1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if book not found', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      prisma.book.update.mockResolvedValue({ id: 1, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw BadRequestException for LOANED status', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.update(1, { status: 'LOANED' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a book if no loans/reservations', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      prisma.loan.count.mockResolvedValue(0);
      prisma.reservation.count.mockResolvedValue(0);
      prisma.book.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);
      expect(result.id).toBe(1);
    });

    it('should throw BadRequestException if has loans', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1 });
      prisma.loan.count.mockResolvedValue(1);
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });
});
