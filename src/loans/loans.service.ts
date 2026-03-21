import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async reserveBook(dto: CreateReservationDto, userId: number) {
    const book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
    if (!book || book.status === 'AVAILABLE') {
      throw new BadRequestException('Book is available, no need to reserve');
    }

    const [, reservation] = await this.prisma.$transaction([
      this.prisma.book.update({
        where: { id: book.id },
        data: { status: 'RESERVED' },
      }),
      this.prisma.reservation.create({
        data: {
          bookId: dto.bookId,
          userId,
          notes: dto.notes,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return reservation;
  }

  async loanBook(dto: CreateLoanDto, userId: number) {
    const book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
    if (!book || (book.status !== 'AVAILABLE' && book.status !== 'RESERVED')) {
      throw new BadRequestException('Book is not available for loan');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [, loan] = await this.prisma.$transaction([
      this.prisma.book.update({
        where: { id: book.id },
        data: { status: 'LOANED' },
      }),
      this.prisma.loan.create({
        data: {
          bookId: dto.bookId,
          userId,
          notes: dto.notes,
          dueDate,
        },
      }),
    ]);

    return loan;
  }

  async returnBook(loanId: number) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'ACTIVE') {
      throw new BadRequestException('Loan not found or already returned');
    }

    const [, updatedLoan] = await this.prisma.$transaction([
      this.prisma.book.update({
        where: { id: loan.bookId },
        data: { status: 'AVAILABLE' },
      }),
      this.prisma.loan.update({
        where: { id: loanId },
        data: { status: 'COMPLETED', returnedAt: new Date() },
      }),
    ]);

    return updatedLoan;
  }

  async getMyLoans(userId: number) {
    return this.prisma.loan.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        book: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMyReservations(userId: number) {
    const myReservations = await this.prisma.reservation.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        book: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const bookIds = [...new Set(myReservations.map((r) => r.bookId))];

    if (bookIds.length === 0) {
      return [];
    }

    const allReservations = await this.prisma.reservation.findMany({
      where: {
        bookId: { in: bookIds },
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const reservationsByBook = new Map<number, typeof allReservations>();

    for (const res of allReservations) {
      if (!reservationsByBook.has(res.bookId)) {
        reservationsByBook.set(res.bookId, []);
      }
      reservationsByBook.get(res.bookId)!.push(res);
    }

    return myReservations.map((res) => {
      const queue = reservationsByBook.get(res.bookId) ?? [];
      const position = queue.findIndex((item) => item.id === res.id);

      return {
        ...res,
        queuePosition: position + 1,
      };
    });
  }
}