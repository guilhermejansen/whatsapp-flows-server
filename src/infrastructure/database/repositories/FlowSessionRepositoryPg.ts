import { Pool } from 'pg';
import { IFlowSessionRepository } from '../../../domain/flows/repositories/IFlowSessionRepository';
import { FlowSession } from '../../../domain/flows/entities/FlowSession';
import { SessionStatus } from '../../../shared/types/flow-types';
import { NotFoundError } from '../../../shared/errors/ValidationError';

/**
 * PostgreSQL implementation of FlowSession Repository
 */
export class FlowSessionRepositoryPg implements IFlowSessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(session: FlowSession): Promise<FlowSession> {
    const query = `
      INSERT INTO flow_sessions (
        flow_id, flow_token, phone_number, current_screen,
        session_data, status, started_at, last_activity_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      session.flowId,
      session.flowToken,
      session.phoneNumber,
      session.currentScreen,
      JSON.stringify(session.sessionData),
      session.status,
      session.startedAt,
      session.lastActivityAt,
      session.updatedAt || new Date(),
    ]);

    return FlowSession.fromDatabase(result.rows[0]);
  }

  async findById(id: string): Promise<FlowSession | null> {
    const query = 'SELECT * FROM flow_sessions WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return FlowSession.fromDatabase(result.rows[0]);
  }

  async findByFlowToken(flowToken: string): Promise<FlowSession | null> {
    const query = 'SELECT * FROM flow_sessions WHERE flow_token = $1';
    const result = await this.pool.query(query, [flowToken]);

    if (result.rows.length === 0) {
      return null;
    }

    return FlowSession.fromDatabase(result.rows[0]);
  }

  async findByFlowId(flowId: string, status?: SessionStatus): Promise<FlowSession[]> {
    let query = 'SELECT * FROM flow_sessions WHERE flow_id = $1';
    const params: any[] = [flowId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY started_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => FlowSession.fromDatabase(row));
  }

  async findByPhoneNumber(phoneNumber: string, status?: SessionStatus): Promise<FlowSession[]> {
    let query = 'SELECT * FROM flow_sessions WHERE phone_number = $1';
    const params: any[] = [phoneNumber];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY started_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => FlowSession.fromDatabase(row));
  }

  async update(session: FlowSession): Promise<FlowSession> {
    const query = `
      UPDATE flow_sessions
      SET
        phone_number = $1,
        current_screen = $2,
        session_data = $3,
        status = $4,
        completed_at = $5,
        last_activity_at = $6,
        error_message = $7,
        updated_at = $8
      WHERE id = $9
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      session.phoneNumber,
      session.currentScreen,
      JSON.stringify(session.sessionData),
      session.status,
      session.completedAt,
      session.lastActivityAt,
      session.errorMessage,
      new Date(),
      session.id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundError('FlowSession', session.id);
    }

    return FlowSession.fromDatabase(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM flow_sessions WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('FlowSession', id);
    }
  }

  async findExpiredSessions(hoursAgo: number): Promise<FlowSession[]> {
    const query = `
      SELECT * FROM flow_sessions
      WHERE status = 'active'
        AND last_activity_at < NOW() - INTERVAL $1
      ORDER BY last_activity_at ASC
    `;

    const result = await this.pool.query(query, [`${hoursAgo} hours`]);
    return result.rows.map((row) => FlowSession.fromDatabase(row));
  }

  async markExpiredSessions(hoursAgo: number): Promise<number> {
    const query = `
      UPDATE flow_sessions
      SET status = 'expired'
      WHERE status = 'active'
        AND last_activity_at < NOW() - INTERVAL $1
    `;

    const result = await this.pool.query(query, [`${hoursAgo} hours`]);
    return result.rowCount || 0;
  }
}
