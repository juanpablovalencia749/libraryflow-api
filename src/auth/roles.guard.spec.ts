import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'USER' } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'USER' } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });
});
