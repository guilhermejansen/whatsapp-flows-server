import * as crypto from 'crypto';
import { InvalidSignatureError } from '../../../shared/errors/EncryptionError';

/**
 * WebhookValidator Service
 * Validates X-Hub-Signature-256 from Meta webhooks
 */
export class WebhookValidator {
  /**
   * Validate X-Hub-Signature-256 signature
   * @param payload Raw webhook payload (as string or Buffer)
   * @param signature X-Hub-Signature-256 header value
   * @param appSecret Meta App Secret
   * @returns true if valid, false otherwise
   */
  public validateSignature(
    payload: string | Buffer,
    signature: string | undefined,
    appSecret: string
  ): boolean {
    if (!signature) {
      throw new InvalidSignatureError('X-Hub-Signature-256 header missing');
    }

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.startsWith('sha256=') ? signature.substring(7) : signature;

    // Calculate HMAC SHA256
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    // Compare signatures (timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  }

  /**
   * Validate and throw error if invalid
   */
  public validateOrThrow(
    payload: string | Buffer,
    signature: string | undefined,
    appSecret: string
  ): void {
    if (!this.validateSignature(payload, signature, appSecret)) {
      throw new InvalidSignatureError('Invalid webhook signature');
    }
  }
}
