import { Pool } from 'pg';
import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { Flow } from '../../../domain/flows/entities/Flow';
import { FlowJSON, FlowStatus } from '../../../shared/types/flow-types';
import { NotFoundError, ConflictError } from '../../../shared/errors/ValidationError';

/**
 * PostgreSQL implementation of Flow Repository
 */
export class FlowRepositoryPg implements IFlowRepository {
  constructor(private readonly pool: Pool) {}

  async create(
    name: string,
    version: string,
    flowJson: FlowJSON,
    description?: string,
    status: FlowStatus = 'active',
    metaFlowId?: string,
    templateName?: string
  ): Promise<Flow> {
    const query = `
      INSERT INTO flows (name, version, flow_json, description, status, meta_flow_id, template_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [
        name,
        version,
        JSON.stringify(flowJson),
        description,
        status,
        metaFlowId,
        templateName,
      ]);

      return Flow.fromDatabase(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictError(`Flow with name '${name}' already exists`);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Flow | null> {
    const query = 'SELECT * FROM flows WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return Flow.fromDatabase(result.rows[0]);
  }

  async findByName(name: string): Promise<Flow | null> {
    const query = 'SELECT * FROM flows WHERE name = $1';
    const result = await this.pool.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    return Flow.fromDatabase(result.rows[0]);
  }

  async findByMetaFlowId(metaFlowId: string): Promise<Flow | null> {
    const query = 'SELECT * FROM flows WHERE meta_flow_id = $1';
    const result = await this.pool.query(query, [metaFlowId]);

    if (result.rows.length === 0) {
      return null;
    }

    return Flow.fromDatabase(result.rows[0]);
  }

  async findAll(status?: FlowStatus): Promise<Flow[]> {
    let query = 'SELECT * FROM flows';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => Flow.fromDatabase(row));
  }

  async update(
    id: string,
    data: {
      name?: string;
      version?: string;
      flowJson?: FlowJSON;
      description?: string;
      status?: FlowStatus;
      metaFlowId?: string;
      templateName?: string;
    }
  ): Promise<Flow> {
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.version !== undefined) {
      updates.push(`version = $${paramIndex++}`);
      params.push(data.version);
    }
    if (data.flowJson !== undefined) {
      updates.push(`flow_json = $${paramIndex++}`);
      params.push(JSON.stringify(data.flowJson));
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.metaFlowId !== undefined) {
      updates.push(`meta_flow_id = $${paramIndex++}`);
      params.push(data.metaFlowId);
    }
    if (data.templateName !== undefined) {
      updates.push(`template_name = $${paramIndex++}`);
      params.push(data.templateName);
    }

    if (updates.length === 0) {
      const flow = await this.findById(id);
      if (!flow) {
        throw new NotFoundError('Flow', id);
      }
      return flow;
    }

    params.push(id);
    const query = `
      UPDATE flows
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundError('Flow', id);
    }

    return Flow.fromDatabase(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM flows WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Flow', id);
    }
  }

  async existsByName(name: string): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM flows WHERE name = $1)';
    const result = await this.pool.query(query, [name]);
    return result.rows[0].exists;
  }
}
