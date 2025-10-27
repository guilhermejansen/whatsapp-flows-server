import { FlowJSON, FlowStatus } from '../../shared/types/flow-types';

export interface CreateFlowDTO {
  name: string;
  version?: string;
  flowJson: FlowJSON;
  description?: string;
  status?: FlowStatus;
  metaFlowId?: string;
  templateName?: string;
}

export interface UpdateFlowDTO {
  name?: string;
  version?: string;
  flowJson?: FlowJSON;
  description?: string;
  status?: FlowStatus;
  metaFlowId?: string;
  templateName?: string;
}
