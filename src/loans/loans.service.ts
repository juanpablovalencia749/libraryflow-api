import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async reserveBook(dto: CreateReservationDto, userId: number) {
  const book = await this.prisma.book.findUnique({
    where: { id: dto.bookId },
    select: { id: true },
  });

  if (!book) {
    throw new NotFoundException('Book not found');
  }

  const activeReservation = await this.prisma.reservation.findFirst({
    where: {
      bookId: dto.bookId,
      userId,
      status: 'ACTIVE',
    },
  });

  if (activeReservation) {
    throw new BadRequestException(
      'You already have an active reservation for this book',
    );
  }

  const activeLoan = await this.prisma.loan.findFirst({
    where: {
      bookId: dto.bookId,
      userId,
      status: 'ACTIVE',
    },
  });

  if (activeLoan) {
    throw new BadRequestException('You already have this book on loan');
  }

  return this.prisma.reservation.create({
    data: {
      bookId: dto.bookId,
      userId,
      notes: dto.notes,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

 async loanBook(dto: CreateLoanDto, userId: number) {
  return this.prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({
      where: { id: dto.bookId },
      select: { id: true, status: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const activeLoan = await tx.loan.findFirst({
      where: {
        bookId: dto.bookId,
        status: 'ACTIVE',
      },
    });

    if (activeLoan) {
      throw new BadRequestException('Book is already loaned');
    }

    const firstReservation = await tx.reservation.findFirst({
      where: {
        bookId: dto.bookId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (firstReservation && firstReservation.userId !== userId) {
      throw new BadRequestException(
        'You are not first in the reservation queue',
      );
    }

    if (firstReservation && firstReservation.userId === userId) {
      await tx.reservation.update({
        where: { id: firstReservation.id },
        data: {
          status: 'FULFILLED',
          fulfilledAt: new Date(),
        },
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const loan = await tx.loan.create({
      data: {
        bookId: dto.bookId,
        userId,
        notes: dto.notes,
        dueDate,
      },
    });

    await tx.book.update({
      where: { id: book.id },
      data: {
        status: 'LOANED',
      },
    });

    return loan;
  });
}

 async returnBook(loanId: number) {
  return this.prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        bookId: true,
        status: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Loan already returned');
    }

    await tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'COMPLETED',
        returnedAt: new Date(),
      },
    });

    await tx.book.update({
      where: { id: loan.bookId },
      data: {
        status: 'AVAILABLE',
      },
    });

    return {
      message: 'Book returned successfully',
    };
  });
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
