/**
 * WhatsApp Webhook Types
 * Ref: https://developers.facebook.com/docs/whatsapp/flows/guides/receiveflowresponse/
 */

export interface WhatsAppWebhook {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: string;
  metadata: WebhookMetadata;
  contacts?: WebhookContact[];
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
}

export interface WebhookMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  interactive?: InteractiveMessage;
  text?: {
    body: string;
  };
}

export interface InteractiveMessage {
  type: string;
  nfm_reply?: NFMReply;
  button_reply?: ButtonReply;
  list_reply?: ListReply;
}

/**
 * CRITICAL: response_json is a STRING, not an object!
 * You MUST parse it with JSON.parse()
 */
export interface NFMReply {
  response_json: string; // ⚠️ STRING, não objeto!
  body: string;
  name: string;
}

export interface ButtonReply {
  id: string;
  title: string;
}

export interface ListReply {
  id: string;
  title: string;
  description?: string;
}

export interface WebhookStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

/**
 * Parsed Flow Response Data
 * (após fazer JSON.parse(nfm_reply.response_json))
 */
export interface ParsedFlowResponse {
  flow_token: string;
  [key: string]: any; // Campos dinâmicos do Flow (ex: recommend, rating, comments)
}

/**
 * Webhook Event Entity (Database)
 */
export interface WebhookEventEntity {
  id: string;
  event_type: string;
  raw_payload: Record<string, any>;
  signature?: string;
  signature_valid: boolean;
  processed: boolean;
  callback_sent: boolean;
  callback_url?: string;
  callback_status_code?: number;
  callback_error?: string;
  received_at: Date;
  processed_at?: Date;
  callback_sent_at?: Date;
}

/**
 * Callback Payload
 * (enviado para CALLBACK_WEBHOOK_URL)
 */
export interface CallbackPayload {
  event_type: 'flow_completed';
  flow_token: string;
  flow_id?: string;
  phone_number?: string;
  response_data: Record<string, any>;
  timestamp: string;
}
