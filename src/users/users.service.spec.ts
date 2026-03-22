import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('should find user by email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 't@t.com' });
      const result = await service.findOneByEmail('t@t.com');
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { name: 'N', email: 'E', passwordHash: 'H' };
      prisma.user.create.mockResolvedValue({ id: 1, ...dto });
      const result = await service.create(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      prisma.user.update.mockResolvedValue({ id: 1 });
      await service.updateRefreshToken(1, 'token', new Date());
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
