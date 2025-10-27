import { Flow } from '../entities/Flow';
import { FlowJSON, FlowStatus } from '../../../shared/types/flow-types';

/**
 * Flow Repository Interface
 */
export interface IFlowRepository {
  /**
   * Create a new Flow
   */
  create(
    name: string,
    version: string,
    flowJson: FlowJSON,
    description?: string,
    status?: FlowStatus,
    metaFlowId?: string,
    templateName?: string
  ): Promise<Flow>;

  /**
   * Find Flow by ID
   */
  findById(id: string): Promise<Flow | null>;

  /**
   * Find Flow by name
   */
  findByName(name: string): Promise<Flow | null>;

  /**
   * Find Flow by Meta Flow ID
   */
  findByMetaFlowId(metaFlowId: string): Promise<Flow | null>;

  /**
   * List all Flows
   */
  findAll(status?: FlowStatus): Promise<Flow[]>;

  /**
   * Update Flow
   */
  update(
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
  ): Promise<Flow>;

  /**
   * Delete Flow
   */
  delete(id: string): Promise<void>;

  /**
   * Check if Flow exists by name
   */
  existsByName(name: string): Promise<boolean>;
}
