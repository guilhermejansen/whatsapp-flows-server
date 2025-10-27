import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { getCorsOptions, getHelmetOptions, getRateLimiter } from './config/security.config';
import { getPool } from './infrastructure/database/connection/pg-pool';
import { logger } from './infrastructure/logging/winston-logger';
import { swaggerSpec } from './config/swagger.config';

// Repositories
import { FlowRepositoryPg } from './infrastructure/database/repositories/FlowRepositoryPg';
import { FlowSessionRepositoryPg } from './infrastructure/database/repositories/FlowSessionRepositoryPg';
import { FlowResponseRepositoryPg } from './infrastructure/database/repositories/FlowResponseRepositoryPg';
import { WebhookEventRepositoryPg } from './infrastructure/database/repositories/WebhookEventRepositoryPg';

// Services
import { FlowEngine } from './domain/flows/services/FlowEngine';
import { FlowValidator } from './domain/flows/services/FlowValidator';
import { FlowTokenMapper } from './domain/flows/services/FlowTokenMapper';
import { WebhookValidator } from './domain/webhooks/services/WebhookValidator';
import { EncryptionService } from './infrastructure/security/EncryptionService';
import { CallbackClient } from './infrastructure/http/axios/callback-client';
import { env } from './config/env.config';

// Use Cases
import { CreateFlowUseCase } from './application/use-cases/flows/CreateFlowUseCase';
import { ListFlowsUseCase } from './application/use-cases/flows/ListFlowsUseCase';
import { GetFlowByIdUseCase } from './application/use-cases/flows/GetFlowByIdUseCase';
import { UpdateFlowUseCase } from './application/use-cases/flows/UpdateFlowUseCase';
import { DeleteFlowUseCase } from './application/use-cases/flows/DeleteFlowUseCase';
import { HandleFlowRequestUseCase } from './application/use-cases/flows/HandleFlowRequestUseCase';
import { ProcessWebhookUseCase } from './application/use-cases/webhooks/ProcessWebhookUseCase';

// Controllers
import { FlowController } from './infrastructure/http/express/controllers/FlowController';
import { EndpointController } from './infrastructure/http/express/controllers/EndpointController';
import { WebhookController } from './infrastructure/http/express/controllers/WebhookController';
import { HealthController } from './infrastructure/http/express/controllers/HealthController';

// Routes
import { createFlowRoutes } from './infrastructure/http/express/routes/flow.routes';
import { createEndpointRoutes } from './infrastructure/http/express/routes/endpoint.routes';
import { createWebhookRoutes } from './infrastructure/http/express/routes/webhook.routes';
import { createHealthRoutes } from './infrastructure/http/express/routes/health.routes';

// Middlewares
import { errorHandler } from './infrastructure/http/express/middlewares/error-handler';
import { requestLogger } from './infrastructure/http/express/middlewares/request-logger';

/**
 * Create and configure Express server
 */
export function createServer(): Express {
  const app = express();

  // ======================
  // TRUST PROXY CONFIGURATION
  // ======================
  // Required for rate limiting and correct client IP detection behind proxies/load balancers
  app.set('trust proxy', true);

  // ======================
  // MIDDLEWARE SETUP
  // ======================

  // Security headers
  app.use(getHelmetOptions());

  // CORS
  app.use(cors(getCorsOptions()));

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(getRateLimiter());

  // Body parser with raw body capture (needed for webhook signature validation)
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );

  // Request logger
  app.use(requestLogger);

  // ======================
  // DEPENDENCY INJECTION
  // ======================

  const pool = getPool();

  // Repositories
  const flowRepository = new FlowRepositoryPg(pool);
  const flowSessionRepository = new FlowSessionRepositoryPg(pool);
  const flowResponseRepository = new FlowResponseRepositoryPg(pool);
  const webhookEventRepository = new WebhookEventRepositoryPg(pool);

  // Services
  const flowEngine = new FlowEngine();
  const flowValidator = new FlowValidator();
  const flowTokenMapper = new FlowTokenMapper();
  const webhookValidator = new WebhookValidator();

  // Initialize encryption service with native crypto (WhatsApp compatible)
  const privateKeyPem = env.PRIVATE_KEY.replace(/\\n/g, '\n');
  const encryptionService = new EncryptionService(privateKeyPem, env.PASSPHRASE);

  const callbackForwarder = new CallbackClient();

  // Use Cases
  const createFlowUseCase = new CreateFlowUseCase(flowRepository, flowValidator);
  const listFlowsUseCase = new ListFlowsUseCase(flowRepository);
  const getFlowByIdUseCase = new GetFlowByIdUseCase(flowRepository);
  const updateFlowUseCase = new UpdateFlowUseCase(flowRepository, flowValidator);
  const deleteFlowUseCase = new DeleteFlowUseCase(flowRepository);
  const handleFlowRequestUseCase = new HandleFlowRequestUseCase(
    encryptionService,
    flowRepository,
    flowSessionRepository,
    flowEngine,
    flowTokenMapper
  );
  const processWebhookUseCase = new ProcessWebhookUseCase(
    webhookValidator,
    flowSessionRepository,
    flowResponseRepository,
    webhookEventRepository,
    callbackForwarder
  );

  // Controllers
  const flowController = new FlowController(
    createFlowUseCase,
    listFlowsUseCase,
    getFlowByIdUseCase,
    updateFlowUseCase,
    deleteFlowUseCase
  );
  const endpointController = new EndpointController(handleFlowRequestUseCase);
  const webhookController = new WebhookController(processWebhookUseCase);
  const healthController = new HealthController();

  // ======================
  // API DOCUMENTATION
  // ======================

  // Swagger UI options
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WhatsApp Flow Server API Documentation',
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON endpoint
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ======================
  // ROUTES
  // ======================

  app.use('/api/flows', createFlowRoutes(flowController));
  app.use('/flows/endpoint', createEndpointRoutes(endpointController));
  app.use('/webhooks/whatsapp', createWebhookRoutes(webhookController));
  app.use('/health', createHealthRoutes(healthController));

  // ======================
  // ERROR HANDLER
  // ======================

  app.use(errorHandler);

  logger.info('Express server configured');

  return app;
}
