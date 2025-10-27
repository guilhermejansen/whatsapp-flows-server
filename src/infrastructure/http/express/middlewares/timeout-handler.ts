import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../logging/winston-logger';

/**
 * Timeout Handler Middleware
 * Enforces timeout for Flow Endpoint (must be < 3s for WhatsApp)
 */
export function timeoutHandler(timeoutMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
          method: req.method,
          path: req.path,
          timeoutMs,
        });

        res.status(408).json({
          success: false,
          error: {
            message: 'Request timeout',
            code: 'TIMEOUT',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
}
