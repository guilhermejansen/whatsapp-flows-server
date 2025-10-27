import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../../shared/errors/AppError';
import { logger } from '../../../logging/winston-logger';

/**
 * Global Error Handler Middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    logger.error('Application error', {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
      path: req.path,
      method: req.method,
      isOperational: error.isOperational,
    });

    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.name,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    // Unexpected error
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
