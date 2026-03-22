import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LoansService', () => {
  let service: LoansService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            reservation: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            loan: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reserveBook', () => {
    it('should create a reservation if eligible', async () => {
      (prisma.book.findUnique as jest.Mock).mockResolvedValue({ id: 1 } as any);
      (prisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.loan.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.reservation.create as jest.Mock).mockResolvedValue({ id: 1 } as any);

      const result = await service.reserveBook({ bookId: 1 }, 1);
      expect(result.id).toBe(1);
    });

    it('should throw BadRequestException if already reserved', async () => {
      (prisma.book.findUnique as jest.Mock).mockResolvedValue({ id: 1 } as any);
      (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({ id: 1 } as any);
      await expect(service.reserveBook({ bookId: 1 }, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('loanBook', () => {
    it('should create a loan in a transaction', async () => {
      const tx = {
        book: { 
          findUnique: jest.fn().mockResolvedValue({ id: 1, status: 'AVAILABLE' } as any), 
          update: jest.fn().mockResolvedValue({ id: 1 } as any) 
        },
        loan: { 
          findFirst: jest.fn().mockResolvedValue(null), 
          create: jest.fn().mockResolvedValue({ id: 1 } as any) 
        },
        reservation: { 
          findFirst: jest.fn().mockResolvedValue(null), 
          update: jest.fn().mockResolvedValue({ id: 1 } as any) 
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(tx));

      const result = await service.loanBook({ bookId: 1 }, 1);
      expect(result.id).toBe(1);
    });

    it('should throw BadRequestException if not first in queue', async () => {
      const tx = {
        book: { 
          findUnique: jest.fn().mockResolvedValue({ id: 1 } as any), 
          update: jest.fn() 
        },
        loan: { 
          findFirst: jest.fn().mockResolvedValue(null), 
          create: jest.fn() 
        },
        reservation: { 
          findFirst: jest.fn().mockResolvedValue({ id: 5, userId: 99 } as any), 
          update: jest.fn() 
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(tx));

      await expect(service.loanBook({ bookId: 1 }, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('returnBook', () => {
    it('should mark loan as completed and book as available', async () => {
      const tx = {
        loan: { 
          findUnique: jest.fn().mockResolvedValue({ id: 1, bookId: 1, status: 'ACTIVE' } as any), 
          update: jest.fn().mockResolvedValue({ id: 1 } as any) 
        },
        book: { 
          update: jest.fn().mockResolvedValue({ id: 1 } as any) 
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(tx));

      const result = await service.returnBook(1);
      expect(result.message).toContain('success');
    });
  });
});
