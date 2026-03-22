import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('LoggerService', () => {
  let service: LoggerService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should create an audit log', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 1 });
      await service.logAction(1, 'CREATE', 'desc', '/test');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getLogs', () => {
    it('should return logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      const result = await service.getLogs();
      expect(result).toEqual([]);
    });
  });
});
