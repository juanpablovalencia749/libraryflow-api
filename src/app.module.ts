import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { BooksModule } from './books/books.module.js';
import { LoansModule } from './loans/loans.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { AuditInterceptor } from './logger/audit.interceptor.js';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [PrismaService],
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, BooksModule, LoansModule, LoggerModule],
})
export class AppModule {}