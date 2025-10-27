import axios, { AxiosInstance } from 'axios';
import { ICallbackForwarder } from '../../../domain/webhooks/services/CallbackForwarder';
import { CallbackPayload } from '../../../shared/types/webhook-types';
import { env } from '../../../config/env.config';
import { logger } from '../../logging/winston-logger';

/**
 * CallbackClient - HTTP client for forwarding callbacks
 * Implements ICallbackForwarder with retry logic
 */
export class CallbackClient implements ICallbackForwarder {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: env.CALLBACK_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Flow-Server/1.0',
      },
    });
  }

  /**
   * Forward callback to external URL
   * @returns HTTP status code
   */
  public async forward(url: string, payload: CallbackPayload): Promise<number> {
    try {
      const response = await this.client.post(url, payload);
      logger.info('Callback forwarded successfully', {
        url,
        statusCode: response.status,
        flowToken: payload.flow_token,
      });
      return response.status;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 0;
        logger.error('Callback forward failed', {
          url,
          statusCode,
          error: error.message,
          flowToken: payload.flow_token,
        });
        throw error;
      }
      throw error;
    }
  }

  /**
   * Forward with retries and exponential backoff
   * @returns HTTP status code of successful attempt
   */
  public async forwardWithRetries(
    url: string,
    payload: CallbackPayload,
    maxRetries: number
  ): Promise<number> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const statusCode = await this.forward(url, payload);
        return statusCode;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delayMs = Math.pow(2, attempt) * 1000;
          logger.warn('Callback retry', {
            attempt: attempt + 1,
            maxRetries,
            delayMs,
            url,
            flowToken: payload.flow_token,
          });
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError || new Error('All callback retries failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
