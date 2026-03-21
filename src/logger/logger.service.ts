import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(userId: number | null, action: string, description: string, reqPath: string) {
    this.logger.log(`Action: ${action} | User: ${userId} | Desc: ${description}`);
    
    // Save to DB Traceability AuditLog table
    await this.prisma.auditLog.create({
      data: {
        userId,
        entityName: reqPath,
        action,
        description,
      },
    }).catch(e => this.logger.error('Failed to write audit log', e));
  }
}
