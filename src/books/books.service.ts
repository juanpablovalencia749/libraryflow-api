import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { QueryBookDto } from './dto/query-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto, userId: number) {
    return this.prisma.book.create({
      data: {
        ...createBookDto,
        createdById: userId,
      },
    });
  }

  async findAll(query: QueryBookDto, userId: number) {
    const { page, limit, title, author, status, sortBy, order } = query;
    const skip = (page! - 1) * limit!;

    const where: any = {};
    if (title) where.title = { contains: title };
    if (author) where.author = { contains: author };
    if (status) where.status = status;

    const [total, data] = await Promise.all([
      this.prisma.book.count({ where }),
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: order },
      }),
    ]);

    const bookIds = data.map((book) => book.id);

    const [reservations, myLoans] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          bookId: { in: bookIds },
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          bookId: true,
          userId: true,
          createdAt: true,
        },
      }),
      this.prisma.loan.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          bookId: { in: bookIds },
        },
        select: {
          bookId: true,
        },
      }),
    ]);

    const reservationsByBook = new Map<number, typeof reservations>();

    for (const res of reservations) {
      if (!reservationsByBook.has(res.bookId)) {
        reservationsByBook.set(res.bookId, []);
      }
      reservationsByBook.get(res.bookId)!.push(res);
    }

    const myLoanBookIds = new Set(myLoans.map((loan) => loan.bookId));

    const enrichedData = data.map((book) => {
      const bookReservations = reservationsByBook.get(book.id) ?? [];
      const myReservationIndex = bookReservations.findIndex(
        (reservation) => reservation.userId === userId,
      );

      return {
        ...book,
        reservationCount: bookReservations.length,
        hasMyReservation: myReservationIndex !== -1,
        myQueuePosition: myReservationIndex !== -1 ? myReservationIndex + 1 : null,
        nextQueuePositionIfReserveNow: bookReservations.length + 1,
        borrowedByMe: myLoanBookIds.has(book.id),
      };
    });

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');

    const [reservations, myLoan] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          bookId: id,
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
      }),
      this.prisma.loan.findFirst({
        where: {
          bookId: id,
          userId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      }),
    ]);

    const myReservationIndex = reservations.findIndex(
      (reservation) => reservation.userId === userId,
    );

    return {
      ...book,
      reservationCount: reservations.length,
      hasMyReservation: myReservationIndex !== -1,
      myQueuePosition: myReservationIndex !== -1 ? myReservationIndex + 1 : null,
      nextQueuePositionIfReserveNow: reservations.length + 1,
      borrowedByMe: !!myLoan,
    };
  }

  // async update(id: number, updateBookDto: UpdateBookDto) {
  //   await this.findOne(id, 0);
  //   return this.prisma.book.update({
  //     where: { id },
  //     data: updateBookDto,
  //   });
  // }
  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (updateBookDto.status === 'LOANED') {
      throw new BadRequestException(
        'Book status LOANED is managed by the loan flow, not by manual update',
      );
    }

    return this.prisma.book.update({
      where: { id },
      data: updateBookDto,
    });
  }

  async remove(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const [loanCount, reservationCount] = await Promise.all([
      this.prisma.loan.count({ where: { bookId: id } }),
      this.prisma.reservation.count({ where: { bookId: id } }),
    ]);

    if (loanCount > 0 || reservationCount > 0) {
      throw new BadRequestException(
        'Cannot delete the book because it has loans or reservations',
      );
    }

    return this.prisma.book.delete({ where: { id } });
  }
}