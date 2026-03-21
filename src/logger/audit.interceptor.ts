import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    
    return next.handle().pipe(
      tap(() => {
        // Only log critical mutating methods like POST, PUT, PATCH, DELETE
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const userId = req.user?.userId || null;
          this.loggerService.logAction(
            userId, 
            method, 
            `Successful execution on ${url}`, 
            url
          );
        }
      }),
    );
  }
}
