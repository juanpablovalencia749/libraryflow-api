import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from './audit.interceptor.js';
import { LoggerService } from './logger.service.js';
import { of } from 'rxjs';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let loggerService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: LoggerService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log critical actions (POST)', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/test',
          user: { userId: 1 },
        }),
      }),
    } as any;

    const next = {
      handle: () => of('test'),
    };

    interceptor.intercept(context, next).subscribe(() => {
      expect(loggerService.logAction).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT log GET actions', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/test',
        }),
      }),
    } as any;

    const next = {
      handle: () => of('test'),
    };

    interceptor.intercept(context, next).subscribe(() => {
      expect(loggerService.logAction).not.toHaveBeenCalled();
      done();
    });
  });
});
