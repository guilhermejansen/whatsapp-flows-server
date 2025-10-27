import { WebhookEvent } from '../entities/WebhookEvent';

/**
 * WebhookEvent Repository Interface
 */
export interface IWebhookEventRepository {
  /**
   * Create a new webhook event
   */
  create(event: WebhookEvent): Promise<WebhookEvent>;

  /**
   * Find event by ID
   */
  findById(id: string): Promise<WebhookEvent | null>;

  /**
   * Find events by type
   */
  findByType(eventType: string, limit?: number): Promise<WebhookEvent[]>;

  /**
   * Find unprocessed events
   */
  findUnprocessed(limit?: number): Promise<WebhookEvent[]>;

  /**
   * Find events with failed callbacks
   */
  findFailedCallbacks(limit?: number): Promise<WebhookEvent[]>;

  /**
   * Update event
   */
  update(event: WebhookEvent): Promise<WebhookEvent>;

  /**
   * Delete event
   */
  delete(id: string): Promise<void>;

  /**
   * Count events by type
   */
  countByType(eventType: string): Promise<number>;
}
