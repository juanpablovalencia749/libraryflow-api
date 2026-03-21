import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Get,
} from '@nestjs/common';
import { LoansService } from './loans.service.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('reserve')
  @ApiOperation({ summary: 'Reserve a book' })
  reserveBook(@Body() dto: CreateReservationDto, @Request() req) {
    return this.loansService.reserveBook(dto, req.user.userId);
  }

  @Post('loan')
  @ApiOperation({ summary: 'Loan a book' })
  loanBook(@Body() dto: CreateLoanDto, @Request() req) {
    return this.loansService.loanBook(dto, req.user.userId);
  }

  @Patch('return/:id')
  @ApiOperation({ summary: 'Return a loaned book' })
  returnBook(@Param('id') loanId: string) {
    return this.loansService.returnBook(+loanId);
  }

  @Get('my-loans')
  @ApiOperation({ summary: 'Get my active loans' })
  getMyLoans(@Request() req) {
    return this.loansService.getMyLoans(req.user.userId);
  }

  @Get('my-reservations')
  @ApiOperation({ summary: 'Get my active reservations with queue position' })
  getMyReservations(@Request() req) {
    return this.loansService.getMyReservations(req.user.userId);
  }
}