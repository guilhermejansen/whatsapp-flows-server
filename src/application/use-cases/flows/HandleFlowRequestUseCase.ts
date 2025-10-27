import { IEncryptionService } from '../../../domain/encryption/services/IEncryptionService';
import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { IFlowSessionRepository } from '../../../domain/flows/repositories/IFlowSessionRepository';
import { FlowEngine } from '../../../domain/flows/services/FlowEngine';
import { FlowTokenMapper } from '../../../domain/flows/services/FlowTokenMapper';
import { FlowSession } from '../../../domain/flows/entities/FlowSession';
import { FlowRequestDTO, FlowResponseDTO } from '../../dtos/FlowRequestDTO';
import { FLOW_ACTIONS } from '../../../shared/constants/flow-actions';
import { ValidationError, NotFoundError } from '../../../shared/errors/ValidationError';
import { logger } from '../../../infrastructure/logging/winston-logger';
import { env } from '../../../config/env.config';

/**
 * HandleFlowRequestUseCase
 * Process incoming Flow Endpoint requests (ping, INIT, data_exchange, navigate, complete)
 *
 * CRITICAL: Must respond in < 3 seconds (WhatsApp timeout)
 *
 * Flow Identification System (3 layers):
 * 1. Path parameter /:flowName (primary)
 * 2. Token mapping cache (fallback for ping → INIT sequence)
 * 3. Default flow from env (last resort)
 */
export class HandleFlowRequestUseCase {
  constructor(
    private readonly encryptionService: IEncryptionService,
    private readonly flowRepository: IFlowRepository,
    private readonly flowSessionRepository: IFlowSessionRepository,
    private readonly flowEngine: FlowEngine,
    private readonly flowTokenMapper: FlowTokenMapper
  ) {}

  public async execute(request: FlowRequestDTO): Promise<FlowResponseDTO> {
    const startTime = Date.now();

    try {
      // 1. Decrypt request
      const decrypted = this.encryptionService.decryptRequest(
        request.encrypted_aes_key,
        request.encrypted_flow_data,
        request.initial_vector
      );

      logger.info('Flow request decrypted', {
        action: decrypted.action,
        flowToken: decrypted.flow_token,
        screen: decrypted.screen,
      });

      // 2. Handle ping action (health check)
      if (decrypted.action === FLOW_ACTIONS.PING) {
        // Store flow_token → flow_name mapping for future INIT requests (Layer 2 fallback)
        if (request.flow_name && decrypted.flow_token) {
          await this.flowTokenMapper.setFlowName(decrypted.flow_token, request.flow_name);
          logger.debug('Flow token mapping stored during ping', {
            flowToken: decrypted.flow_token,
            flowName: request.flow_name,
          });
        }

        const response = this.flowEngine.processPing();
        const aesKey = this.encryptionService.decryptAesKey(request.encrypted_aes_key);
        const encrypted = this.encryptionService.encryptResponse(
          response,
          aesKey,
          request.initial_vector
        );

        logger.info('Flow ping processed', {
          duration: Date.now() - startTime,
        });
        return encrypted;
      }

      // 3. Get or create session
      let session = await this.flowSessionRepository.findByFlowToken(decrypted.flow_token);

      if (!session && decrypted.action === FLOW_ACTIONS.INIT) {
        // 3-Layer Flow Identification System
        let flowName: string | undefined = request.flow_name; // Layer 1: Path parameter (primary)

        // Layer 2: Token mapping cache (fallback for ping → INIT sequence)
        if (!flowName && decrypted.flow_token) {
          flowName = await this.flowTokenMapper.getFlowName(decrypted.flow_token);
          if (flowName) {
            logger.info('Flow identified via token mapping cache', {
              flowToken: decrypted.flow_token,
              flowName,
            });
          }
        }

        // Layer 3: Default flow from environment (last resort)
        if (!flowName) {
          flowName = env.DEFAULT_FLOW_NAME;
          logger.warn('Flow identified via default fallback', {
            flowToken: decrypted.flow_token,
            defaultFlowName: flowName,
          });
        }

        // Final validation
        if (!flowName) {
          throw new ValidationError(
            'Cannot identify flow. Use path parameter: POST /flows/endpoint/{flowName}. ' +
              'Example: POST /flows/endpoint/csat-feedback'
          );
        }

        // Find specific flow by name
        const flow = await this.flowRepository.findByName(flowName);
        if (!flow) {
          throw new NotFoundError('Flow', flowName);
        }

        if (!flow.isActive()) {
          throw new ValidationError(`Flow '${flowName}' is not active`);
        }

        // Create session with identified flow
        session = FlowSession.create(flow.id, decrypted.flow_token);
        session = await this.flowSessionRepository.create(session);

        logger.info('New session created', {
          sessionId: session.id,
          flowToken: session.flowToken,
          flowId: session.flowId,
          flowName,
          identificationMethod: request.flow_name
            ? 'path_parameter'
            : decrypted.flow_token
              ? 'token_mapping'
              : 'default_fallback',
        });
      }

      if (!session) {
        throw new ValidationError('Session not found. Use INIT action to start a new session.');
      }

      // 4. Get flow
      const flow = await this.flowRepository.findById(session.flowId);
      if (!flow) {
        throw new NotFoundError('Flow', session.flowId);
      }

      if (!flow.isActive()) {
        throw new ValidationError('Flow is not active');
      }

      // 5. Process action
      const response = this.flowEngine.processAction(
        decrypted.action,
        flow,
        session,
        decrypted.data,
        decrypted.screen,
        decrypted.next_screen
      );

      // 6. Update session
      await this.flowSessionRepository.update(session);

      // 7. Encrypt response
      const aesKey = this.encryptionService.decryptAesKey(request.encrypted_aes_key);
      const encrypted = this.encryptionService.encryptResponse(
        response,
        aesKey,
        request.initial_vector
      );

      const duration = Date.now() - startTime;
      logger.info('Flow request processed', {
        action: decrypted.action,
        flowToken: decrypted.flow_token,
        duration,
      });

      if (duration > 2500) {
        logger.warn('Flow request took too long', { duration });
      }

      return encrypted;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Flow request failed', {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}
