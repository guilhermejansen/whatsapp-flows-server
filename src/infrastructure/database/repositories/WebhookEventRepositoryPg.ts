import { Pool } from 'pg';
import { IWebhookEventRepository } from '../../../domain/webhooks/repositories/IWebhookEventRepository';
import { WebhookEvent } from '../../../domain/webhooks/entities/WebhookEvent';
import { NotFoundError } from '../../../shared/errors/ValidationError';

/**
 * PostgreSQL implementation of WebhookEvent Repository
 */
export class WebhookEventRepositoryPg implements IWebhookEventRepository {
  constructor(private readonly pool: Pool) {}

  async create(event: WebhookEvent): Promise<WebhookEvent> {
    const query = `
      INSERT INTO webhook_events (
        event_type, raw_payload, signature, signature_valid,
        processed, callback_sent, received_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      event.eventType,
      JSON.stringify(event.rawPayload),
      event.signature,
      event.signatureValid,
      event.processed,
      event.callbackSent,
      event.receivedAt,
    ]);

    return WebhookEvent.fromDatabase(result.rows[0]);
  }

  async findById(id: string): Promise<WebhookEvent | null> {
    const query = 'SELECT * FROM webhook_events WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return WebhookEvent.fromDatabase(result.rows[0]);
  }

  async findByType(eventType: string, limit?: number): Promise<WebhookEvent[]> {
    let query = 'SELECT * FROM webhook_events WHERE event_type = $1 ORDER BY received_at DESC';
    const params: any[] = [eventType];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => WebhookEvent.fromDatabase(row));
  }

  async findUnprocessed(limit?: number): Promise<WebhookEvent[]> {
    let query = 'SELECT * FROM webhook_events WHERE processed = false ORDER BY received_at ASC';
    const params: any[] = [];

    if (limit) {
      query += ` LIMIT $1`;
      params.push(limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => WebhookEvent.fromDatabase(row));
  }

  async findFailedCallbacks(limit?: number): Promise<WebhookEvent[]> {
    let query = `
      SELECT * FROM webhook_events
      WHERE processed = true AND callback_sent = false
      ORDER BY received_at DESC
    `;
    const params: any[] = [];

    if (limit) {
      query += ` LIMIT $1`;
      params.push(limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => WebhookEvent.fromDatabase(row));
  }

  async update(event: WebhookEvent): Promise<WebhookEvent> {
    const query = `
      UPDATE webhook_events
      SET
        signature_valid = $1,
        processed = $2,
        callback_sent = $3,
        callback_url = $4,
        callback_status_code = $5,
        callback_error = $6,
        processed_at = $7,
        callback_sent_at = $8
      WHERE id = $9
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      event.signatureValid,
      event.processed,
      event.callbackSent,
      event.callbackUrl,
      event.callbackStatusCode,
      event.callbackError,
      event.processedAt,
      event.callbackSentAt,
      event.id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError('WebhookEvent', event.id);
    }

    return WebhookEvent.fromDatabase(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM webhook_events WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('WebhookEvent', id);
    }
  }

  async countByType(eventType: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM webhook_events WHERE event_type = $1';
    const result = await this.pool.query(query, [eventType]);
    return parseInt(result.rows[0].count, 10);
  }
}
