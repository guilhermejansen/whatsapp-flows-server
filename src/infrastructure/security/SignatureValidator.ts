import { WebhookValidator } from '../../domain/webhooks/services/WebhookValidator';

/**
 * Re-export WebhookValidator as SignatureValidator
 * (Infrastructure implementation is the same as domain service)
 */
export { WebhookValidator as SignatureValidator };
