import { Pool } from 'pg';
import { IFlowResponseRepository } from '../../../domain/flows/repositories/IFlowResponseRepository';
import { FlowResponse } from '../../../domain/flows/entities/FlowResponse';
import { NotFoundError } from '../../../shared/errors/ValidationError';

/**
 * PostgreSQL implementation of FlowResponse Repository
 */
export class FlowResponseRepositoryPg implements IFlowResponseRepository {
  constructor(private readonly pool: Pool) {}

  async create(response: FlowResponse): Promise<FlowResponse> {
    const query = `
      INSERT INTO flow_responses (
        session_id, flow_id, flow_token, phone_number,
        response_data, raw_webhook_payload, received_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      response.sessionId,
      response.flowId,
      response.flowToken,
      response.phoneNumber,
      JSON.stringify(response.responseData),
      response.rawWebhookPayload ? JSON.stringify(response.rawWebhookPayload) : null,
      response.receivedAt,
    ]);

    return FlowResponse.fromDatabase(result.rows[0]);
  }

  async findById(id: string): Promise<FlowResponse | null> {
    const query = 'SELECT * FROM flow_responses WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return FlowResponse.fromDatabase(result.rows[0]);
  }

  async findBySessionId(sessionId: string): Promise<FlowResponse[]> {
    const query = 'SELECT * FROM flow_responses WHERE session_id = $1 ORDER BY received_at DESC';
    const result = await this.pool.query(query, [sessionId]);
    return result.rows.map((row) => FlowResponse.fromDatabase(row));
  }

  async findByFlowId(flowId: string, limit?: number): Promise<FlowResponse[]> {
    let query = 'SELECT * FROM flow_responses WHERE flow_id = $1 ORDER BY received_at DESC';
    const params: any[] = [flowId];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => FlowResponse.fromDatabase(row));
  }

  async findByFlowToken(flowToken: string): Promise<FlowResponse[]> {
    const query = 'SELECT * FROM flow_responses WHERE flow_token = $1 ORDER BY received_at DESC';
    const result = await this.pool.query(query, [flowToken]);
    return result.rows.map((row) => FlowResponse.fromDatabase(row));
  }

  async findByPhoneNumber(phoneNumber: string, limit?: number): Promise<FlowResponse[]> {
    let query = 'SELECT * FROM flow_responses WHERE phone_number = $1 ORDER BY received_at DESC';
    const params: any[] = [phoneNumber];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => FlowResponse.fromDatabase(row));
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM flow_responses WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('FlowResponse', id);
    }
  }

  async countByFlowId(flowId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM flow_responses WHERE flow_id = $1';
    const result = await this.pool.query(query, [flowId]);
    return parseInt(result.rows[0].count, 10);
  }
}
