import { Request, Response } from 'express';
import { testConnection } from '../../../database/connection/pg-pool';
import { env } from '../../../../config/env.config';

/**
 * Health Controller - Health check endpoint
 */
export class HealthController {
  public check = async (_req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      // Test database connection
      const dbHealthy = await testConnection();

      const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        database: dbHealthy ? 'connected' : 'disconnected',
        responseTime: Date.now() - startTime,
      };

      const statusCode = dbHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
