import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LoansController } from './loans.controller.js';
import { LoansService } from './loans.service.js';

describe('LoansController', () => {
  let controller: LoansController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [
        {
          provide: LoansService,
          useValue: {
            reserveBook: jest.fn(),
            loanBook: jest.fn(),
            returnBook: jest.fn(),
            getMyLoans: jest.fn(),
            getMyReservations: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LoansController>(LoansController);
    service = module.get<LoansService>(LoansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reserveBook', () => {
    it('should call service reserveBook', async () => {
      service.reserveBook.mockResolvedValue({ id: 1 });
      const req = { user: { sub: 1 } };
      const result = await controller.reserveBook({ bookId: 1 }, req as any);
      expect(result.id).toBe(1);
    });
  });

  describe('loanBook', () => {
    it('should call service loanBook', async () => {
      service.loanBook.mockResolvedValue({ id: 1 });
      const req = { user: { sub: 1 } };
      const result = await controller.loanBook({ bookId: 1 }, req as any);
      expect(result.id).toBe(1);
    });
  });

  describe('returnBook', () => {
    it('should call service returnBook', async () => {
      service.returnBook.mockResolvedValue({ message: 'ok' });
      const result = await controller.returnBook('1');
      expect(result.message).toBe('ok');
    });
  });
});
