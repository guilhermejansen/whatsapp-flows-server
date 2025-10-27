import { FlowResponse } from '../entities/FlowResponse';

/**
 * FlowResponse Repository Interface
 */
export interface IFlowResponseRepository {
  /**
   * Create a new Flow response
   */
  create(response: FlowResponse): Promise<FlowResponse>;

  /**
   * Find response by ID
   */
  findById(id: string): Promise<FlowResponse | null>;

  /**
   * Find responses by session ID
   */
  findBySessionId(sessionId: string): Promise<FlowResponse[]>;

  /**
   * Find responses by flow ID
   */
  findByFlowId(flowId: string, limit?: number): Promise<FlowResponse[]>;

  /**
   * Find responses by flow token
   */
  findByFlowToken(flowToken: string): Promise<FlowResponse[]>;

  /**
   * Find responses by phone number
   */
  findByPhoneNumber(phoneNumber: string, limit?: number): Promise<FlowResponse[]>;

  /**
   * Delete response
   */
  delete(id: string): Promise<void>;

  /**
   * Count responses by flow ID
   */
  countByFlowId(flowId: string): Promise<number>;
}
