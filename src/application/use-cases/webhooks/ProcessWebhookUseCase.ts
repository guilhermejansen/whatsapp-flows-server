import { IFlowSessionRepository } from '../../../domain/flows/repositories/IFlowSessionRepository';
import { IFlowResponseRepository } from '../../../domain/flows/repositories/IFlowResponseRepository';
import { IWebhookEventRepository } from '../../../domain/webhooks/repositories/IWebhookEventRepository';
import { WebhookValidator } from '../../../domain/webhooks/services/WebhookValidator';
import { ICallbackForwarder } from '../../../domain/webhooks/services/CallbackForwarder';
import { FlowResponse } from '../../../domain/flows/entities/FlowResponse';
import { WebhookEvent } from '../../../domain/webhooks/entities/WebhookEvent';
import {
  WhatsAppWebhook,
  ParsedFlowResponse,
  CallbackPayload,
} from '../../../shared/types/webhook-types';
import { JsonParser } from '../../../shared/utils/json-parser';
import { env } from '../../../config/env.config';
import { logger } from '../../../infrastructure/logging/winston-logger';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * ProcessWebhookUseCase
 * Process WhatsApp webhook events, especially nfm_reply (Flow completion)
 *
 * CRITICAL:
 * - response_json is a STRING, must be parsed!
 * - webhook does NOT include flow_id, use flow_token to find session
 */
export class ProcessWebhookUseCase {
  constructor(
    private readonly webhookValidator: WebhookValidator,
    private readonly flowSessionRepository: IFlowSessionRepository,
    private readonly flowResponseRepository: IFlowResponseRepository,
    private readonly webhookEventRepository: IWebhookEventRepository,
    private readonly callbackForwarder: ICallbackForwarder
  ) {}

  public async execute(
    payload: WhatsAppWebhook,
    signature: string | undefined,
    rawBody: string
  ): Promise<void> {
    const startTime = Date.now();

    // 1. Create webhook event log
    const webhookEvent = WebhookEvent.create('messages', payload, signature);

    try {
      // 2. Validate signature
      this.webhookValidator.validateOrThrow(rawBody, signature, env.META_APP_SECRET);
      webhookEvent.signatureValid = true;

      logger.info('Webhook signature validated', { signatureValid: true });

      // 3. Save webhook event
      const savedEvent = await this.webhookEventRepository.create(webhookEvent);
      webhookEvent.id = savedEvent.id;

      // 4. Process webhook
      await this.processWebhookPayload(payload, webhookEvent);

      // 5. Mark as processed
      webhookEvent.markAsProcessed();
      await this.webhookEventRepository.update(webhookEvent);

      logger.info('Webhook processed', { duration: Date.now() - startTime });
    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      // Update webhook event with error
      if (webhookEvent.id) {
        try {
          await this.webhookEventRepository.update(webhookEvent);
        } catch (updateError) {
          logger.error('Failed to update webhook event', { updateError });
        }
      }

      throw error;
    }
  }

  private async processWebhookPayload(
    payload: WhatsAppWebhook,
    webhookEvent: WebhookEvent
  ): Promise<void> {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { value } = change;

        // Process messages
        if (value.messages) {
          for (const message of value.messages) {
            // Check if it's an interactive message with nfm_reply
            if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
              await this.processNfmReply(message, webhookEvent);
            }
          }
        }
      }
    }
  }

  private async processNfmReply(message: any, webhookEvent: WebhookEvent): Promise<void> {
    const nfmReply = message.interactive.nfm_reply;

    // ⚠️ CRITICAL: response_json is a STRING, not an object!
    const responseJsonString = nfmReply.response_json;

    if (typeof responseJsonString !== 'string') {
      throw new ValidationError('response_json must be a string');
    }

    // Parse response_json
    const flowData: ParsedFlowResponse = JsonParser.parse(responseJsonString, 'nfm_reply');

    logger.info('NFM reply parsed', {
      flowToken: flowData.flow_token,
      phoneNumber: message.from,
      fields: Object.keys(flowData),
    });

    // Find session by flow_token (webhook does NOT include flow_id!)
    const session = await this.flowSessionRepository.findByFlowToken(flowData.flow_token);

    if (!session) {
      logger.warn('Session not found for flow_token', {
        flowToken: flowData.flow_token,
      });
      throw new ValidationError(`Session not found for flow_token: ${flowData.flow_token}`);
    }

    // Update session phone number if not set
    if (!session.phoneNumber && message.from) {
      session.phoneNumber = message.from;
    }

    // Mark session as completed
    session.complete();
    await this.flowSessionRepository.update(session);

    // Save flow response
    const flowResponse = FlowResponse.create(
      session.id,
      session.flowId,
      flowData.flow_token,
      message.from,
      flowData,
      message // Raw webhook message for auditing
    );

    await this.flowResponseRepository.create(flowResponse);

    logger.info('Flow response saved', {
      sessionId: session.id,
      flowId: session.flowId,
      flowToken: flowData.flow_token,
    });

    // Forward to callback URL
    await this.forwardCallback(flowData, session.flowId, message.from, webhookEvent);
  }

  private async forwardCallback(
    flowData: ParsedFlowResponse,
    flowId: string,
    phoneNumber: string,
    webhookEvent: WebhookEvent
  ): Promise<void> {
    const callbackUrl = env.CALLBACK_WEBHOOK_URL;

    const callbackPayload: CallbackPayload = {
      event_type: 'flow_completed',
      flow_token: flowData.flow_token,
      flow_id: flowId,
      phone_number: phoneNumber,
      response_data: flowData,
      timestamp: new Date().toISOString(),
    };

    webhookEvent.callbackUrl = callbackUrl;

    try {
      const statusCode = await this.callbackForwarder.forwardWithRetries(
        callbackUrl,
        callbackPayload,
        env.CALLBACK_MAX_RETRIES
      );

      webhookEvent.markCallbackSent(statusCode);

      logger.info('Callback forwarded', {
        url: callbackUrl,
        statusCode,
        flowToken: flowData.flow_token,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      webhookEvent.markCallbackFailed(errorMessage);

      logger.error('Callback forward failed', {
        url: callbackUrl,
        error: errorMessage,
        flowToken: flowData.flow_token,
      });

      // Don't throw - we still want to mark webhook as processed
    }
  }
}
