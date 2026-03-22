import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerController } from './logger.controller.js';
import { LoggerService } from './logger.service.js';

describe('LoggerController', () => {
  let controller: LoggerController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoggerController],
      providers: [
        {
          provide: LoggerService,
          useValue: {
            getLogs: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<LoggerController>(LoggerController);
    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should call service getLogs', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(service.getLogs).toHaveBeenCalled();
    });
  });
});
