import { Module } from '@nestjs/common';
import { LoansService } from './loans.service.js';
import { LoansController } from './loans.controller.js';

@Module({
  providers: [LoansService],
  controllers: [LoansController],
})
export class LoansModule {}
