import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service.js';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let passwordService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user info if credentials are valid', async () => {
      const user = { id: 1, email: 'test@example.com', passwordHash: 'hashed' };
      usersService.findOneByEmail.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should return null if credentials are invalid', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if credentials invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      await expect(service.login({ email: 'x', password: 'y' })).rejects.toThrow(UnauthorizedException);
    });

    it('should return access and refresh tokens on success', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'USER' };
      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('token');
      passwordService.hash.mockResolvedValue('hashed');

      const result = await service.login({ email: 'test@example.com', password: 'password' });
      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if user has no refresh token', async () => {
      usersService.findOneById.mockResolvedValue({ refreshToken: null });
      await expect(service.refreshTokens(1, 'token')).rejects.toThrow(UnauthorizedException);
    });

    it('should issue new tokens if refresh token is valid', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
      const user = { 
        id: 1, 
        email: 'test@example.com', 
        role: 'USER', 
        refreshToken: 'hashed',
        refreshTokenExpiresAt: expiresAt
      };
      usersService.findOneById.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(true);
      jest.spyOn(service, 'getTokens').mockResolvedValue({ access_token: 'a', refresh_token: 'r' });

      const result = await service.refreshTokens(1, 'token');
      expect(result).toEqual({ access_token: 'a', refresh_token: 'r' });
    });
  });
});
