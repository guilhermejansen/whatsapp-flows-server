import { Request, Response, NextFunction } from 'express';
import { ProcessWebhookUseCase } from '../../../../application/use-cases/webhooks/ProcessWebhookUseCase';
import { WhatsAppWebhook } from '../../../../shared/types/webhook-types';
import { env } from '../../../../config/env.config';
import { logger } from '../../../logging/winston-logger';

/**
 * Webhook Controller - Handles WhatsApp webhooks
 */
export class WebhookController {
  constructor(private readonly processWebhookUseCase: ProcessWebhookUseCase) {}

  /**
   * GET /webhooks/whatsapp - Webhook verification
   * Meta sends this to verify the endpoint
   */
  public verify = (req: Request, res: Response): void => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
      logger.info('Webhook verified', { challenge });
      res.status(200).send(challenge);
    } else {
      logger.warn('Webhook verification failed', { mode, token });
      res.status(403).send('Forbidden');
    }
  };

  /**
   * POST /webhooks/whatsapp - Receive webhook events
   */
  public handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload: WhatsAppWebhook = req.body;
      const signature = req.get('X-Hub-Signature-256');

      // Get raw body (needed for signature validation)
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      // Process webhook asynchronously (don't block response)
      this.processWebhookUseCase.execute(payload, signature, rawBody).catch((error) => {
        logger.error('Webhook processing failed (async)', {
          error: error instanceof Error ? error.message : String(error),
        });
      });

      // Respond immediately to WhatsApp (200 OK)
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
