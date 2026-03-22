import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service.js';
import { LoggerController } from './logger.controller.js';

@Module({
  providers: [LoggerService],
  controllers: [LoggerController],
  exports: [LoggerService],
})
export class LoggerModule {}
