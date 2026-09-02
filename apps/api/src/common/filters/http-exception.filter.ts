import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Catches all HttpExceptions and formats them into a consistent JSON error shape.
 * Non-HttpExceptions bubble up as 500 Internal Server Error.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>)['message']
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const errorBody: ApiError = {
      statusCode: status,
      message: message as string | string[],
      error:
        exceptionResponse && typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? String((exceptionResponse as Record<string, unknown>)['error'])
          : HttpStatus[status] ?? 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`${status} ${request.method} ${request.url} — ${JSON.stringify(message)}`);
    }

    response.status(status).json(errorBody);
  }
}
