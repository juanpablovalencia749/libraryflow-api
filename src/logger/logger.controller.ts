import {
  Controller,
  Get,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerService } from './logger.service.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('logger')
@Controller('logger')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List logger data' })
  @ApiResponse({ status: 200, description: 'List logger' })
findAll(
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  ) {
    return this.loggerService.getLogs(
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }
}