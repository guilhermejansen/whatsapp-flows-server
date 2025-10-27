import { createServer } from './server';
import { env } from './config/env.config';
import { testConnection, closePool } from './infrastructure/database/connection/pg-pool';
import { logger } from './infrastructure/logging/winston-logger';

/**
 * Bootstrap Application
 */
async function bootstrap() {
  try {
    logger.info('🚀 Starting WhatsApp Flow Server...');

    // Test database connection
    logger.info('📊 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('❌ Database connection failed');
      process.exit(1);
    }

    logger.info('✅ Database connected');

    // Create Express server
    const app = createServer();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info('✅ Server started', {
        port: env.PORT,
        host: env.HOST,
        environment: env.NODE_ENV,
        flowEndpointTimeout: env.FLOW_ENDPOINT_TIMEOUT,
      });

      logger.info('📋 Available endpoints:');
      logger.info(`  - GET  ${env.HOST}:${env.PORT}/health`);
      logger.info(`  - GET  ${env.HOST}:${env.PORT}/docs`);
      logger.info(`  - GET  ${env.HOST}:${env.PORT}/docs.json`);
      logger.info(`  - GET  ${env.HOST}:${env.PORT}/api/flows`);
      logger.info(`  - POST ${env.HOST}:${env.PORT}/api/flows`);
      logger.info(`  - POST ${env.HOST}:${env.PORT}/flows/endpoint`);
      logger.info(`  - POST ${env.HOST}:${env.PORT}/webhooks/whatsapp`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await closePool();
        logger.info('Database pool closed');

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start application
bootstrap();
