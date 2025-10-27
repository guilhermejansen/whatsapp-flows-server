import { CallbackPayload } from '../../../shared/types/webhook-types';

/**
 * CallbackForwarder Service Interface
 * Forwards Flow responses to external callback URL
 */
export interface ICallbackForwarder {
  /**
   * Forward callback to external URL
   * @returns HTTP status code
   */
  forward(url: string, payload: CallbackPayload): Promise<number>;

  /**
   * Forward with retries
   * @returns HTTP status code of successful attempt, or throws error
   */
  forwardWithRetries(url: string, payload: CallbackPayload, maxRetries: number): Promise<number>;
}
