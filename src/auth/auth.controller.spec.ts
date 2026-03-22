import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshTokens: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set refresh token cookie and return access token', async () => {
      const tokens = { access_token: 'access', refresh_token: 'refresh' };
      service.login.mockResolvedValue(tokens);
      
      const res = {
        cookie: jest.fn().mockReturnThis(),
      } as any;
      
      const result = await controller.login({ email: 't@t.com', password: 'p' }, res);
      
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh', expect.any(Object));
      expect(result).toEqual({ access_token: 'access' });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens using cookie', async () => {
      const tokens = { access_token: 'new_access', refresh_token: 'new_refresh' };
      service.refreshTokens.mockResolvedValue(tokens);
      
      const body = { userId: 1 };
      const req = { cookies: { refresh_token: 'old_refresh' } } as any;
      const res = {
        cookie: jest.fn().mockReturnThis(),
      } as any;
      
      const result = await controller.refresh(body, req, res);
      
      expect(service.refreshTokens).toHaveBeenCalledWith(1, 'old_refresh');
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new_refresh', expect.any(Object));
      expect(result).toEqual({ access_token: 'new_access' });
    });
  });
});
