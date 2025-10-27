import { FlowSession } from '../entities/FlowSession';
import { SessionStatus } from '../../../shared/types/flow-types';

/**
 * FlowSession Repository Interface
 */
export interface IFlowSessionRepository {
  /**
   * Create a new session
   */
  create(session: FlowSession): Promise<FlowSession>;

  /**
   * Find session by ID
   */
  findById(id: string): Promise<FlowSession | null>;

  /**
   * Find session by flow token (CRITICAL for webhook processing)
   */
  findByFlowToken(flowToken: string): Promise<FlowSession | null>;

  /**
   * Find sessions by flow ID
   */
  findByFlowId(flowId: string, status?: SessionStatus): Promise<FlowSession[]>;

  /**
   * Find sessions by phone number
   */
  findByPhoneNumber(phoneNumber: string, status?: SessionStatus): Promise<FlowSession[]>;

  /**
   * Update session
   */
  update(session: FlowSession): Promise<FlowSession>;

  /**
   * Delete session
   */
  delete(id: string): Promise<void>;

  /**
   * Find expired sessions (last_activity_at > X hours ago)
   */
  findExpiredSessions(hoursAgo: number): Promise<FlowSession[]>;

  /**
   * Mark expired sessions as expired
   */
  markExpiredSessions(hoursAgo: number): Promise<number>;
}
