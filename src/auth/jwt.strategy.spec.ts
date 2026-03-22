import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy.js';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from payload if user is active', async () => {
      const payload = { sub: 1, email: 't@t.com', role: 'ADMIN' };
      usersService.findOneByEmail.mockResolvedValue({ id: 1, isActive: true });
      
      const result = await strategy.validate(payload);
      expect(result).toEqual({ userId: 1, email: 't@t.com', role: 'ADMIN' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: 1, email: 't@t.com', role: 'ADMIN' };
      usersService.findOneByEmail.mockResolvedValue(null);
      
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const payload = { sub: 1, email: 't@t.com', role: 'ADMIN' };
      usersService.findOneByEmail.mockResolvedValue({ id: 1, isActive: false });
      
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
