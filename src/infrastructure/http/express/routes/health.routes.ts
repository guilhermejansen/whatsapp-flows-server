import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

/**
 * Health Routes - Health check endpoint
 * Base path: /health
 */
export function createHealthRoutes(healthController: HealthController): Router {
  const router = Router();

  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check endpoint
   *     description: Returns server health status, uptime, and timestamp
   *     operationId: healthCheck
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   *             example:
   *               status: healthy
   *               timestamp: '2024-01-01T00:00:00.000Z'
   *               uptime: 12345.678
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/', healthController.check);

  return router;
}
