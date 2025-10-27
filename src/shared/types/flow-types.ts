import {
  FlowStatus as FlowStatusType,
  SessionStatus as SessionStatusType,
} from '../constants/screen-components';
import { FlowAction } from '../constants/flow-actions';

// Re-export types
export type FlowStatus = FlowStatusType;
export type SessionStatus = SessionStatusType;
export type { FlowAction };

/**
 * Flow JSON Structure
 */
export interface FlowJSON {
  version: string;
  screens: FlowScreen[];
  data_channel_uri?: string;
}

export interface FlowScreen {
  id: string;
  title: string;
  terminal?: boolean;
  data?: Record<string, any>;
  layout: ScreenLayout;
  refresh_on_back?: boolean;
}

export interface ScreenLayout {
  type: string;
  children: ScreenComponent[];
}

export interface ScreenComponent {
  type: string;
  name?: string;
  label?: string;
  required?: boolean;
  'data-source'?: any[];
  'on-click-action'?: ClickAction;
  [key: string]: any;
}

export interface ClickAction {
  name: 'navigate' | 'complete' | 'data_exchange';
  next?: {
    type: 'screen';
    name: string;
  };
  payload?: Record<string, any>;
}

/**
 * Flow Endpoint Request/Response
 */
export interface FlowEndpointRequest {
  encrypted_flow_data: string;
  encrypted_aes_key: string;
  initial_vector: string;
}

export interface DecryptedFlowData {
  action: FlowAction;
  flow_token: string;
  screen?: string;
  data?: Record<string, any>;
  version?: string;
  next_screen?: string;
}

export interface FlowEndpointResponse {
  encrypted_flow_data_b64: string;
  encrypted_aes_key?: string;
  initial_vector_b64: string;
}

export interface DecryptedFlowResponse {
  version: string;
  screen?: string;
  data?: Record<string, any>;
  status?: string;
}

/**
 * Database Entities
 */
export interface FlowEntity {
  id: string;
  name: string;
  version: string;
  flow_json: FlowJSON;
  description?: string;
  status: FlowStatus;
  meta_flow_id?: string;
  template_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FlowSessionEntity {
  id: string;
  flow_id: string;
  flow_token: string;
  phone_number?: string;
  current_screen?: string;
  session_data: Record<string, any>;
  status: SessionStatus;
  started_at: Date;
  completed_at?: Date;
  last_activity_at: Date;
  error_message?: string;
}

export interface FlowResponseEntity {
  id: string;
  session_id: string;
  flow_id: string;
  flow_token: string;
  phone_number?: string;
  response_data: Record<string, any>;
  raw_webhook_payload?: Record<string, any>;
  received_at: Date;
}
