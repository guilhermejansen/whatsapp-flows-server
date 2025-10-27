/**
 * Flow Endpoint Request DTO
 */
export interface FlowRequestDTO {
  encrypted_aes_key: string;
  encrypted_flow_data: string;
  initial_vector: string;
  flow_name?: string;
}

/**
 * Flow Endpoint Response DTO
 * WhatsApp expects only the encrypted base64 string (not a JSON object)
 */
export type FlowResponseDTO = string;
