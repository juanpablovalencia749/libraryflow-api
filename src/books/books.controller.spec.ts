import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';

describe('BooksController', () => {
  let controller: BooksController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service create', async () => {
      const dto = { title: 'T', author: 'A', publicationYear: 2000 };
      service.create.mockResolvedValue({ id: 1, ...dto });
      const req = { user: { userId: 1 } };

      const result = await controller.create(dto as any, req as any);
      expect(result.id).toBe(1);
      expect(service.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('should call service findAll', async () => {
      service.findAll.mockResolvedValue({ data: [] });
      const req = { user: { userId: 1 } };
      const result = await controller.findAll({} as any, req as any);
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service findOne', async () => {
      service.findOne.mockResolvedValue({ id: 1 });
      const req = { user: { userId: 1 } };
      const result = await controller.findOne('1', req as any);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service update', async () => {
      service.update.mockResolvedValue({ id: 1 });
      const result = await controller.update('1', {} as any);
      expect(result.id).toBe(1);
    });
  });

  describe('remove', () => {
    it('should call service remove', async () => {
      service.remove.mockResolvedValue({ id: 1 });
      const result = await controller.remove('1');
      expect(result.id).toBe(1);
    });
  });
});
