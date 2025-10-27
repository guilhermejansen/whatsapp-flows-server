import { z } from 'zod';

/**
 * Validation Schemas for WhatsApp Flow Server
 * Compatible with Zod v4 and WhatsApp Flow JSON specification
 */

// =============================================================================
// Screen Component Schemas
// =============================================================================

/**
 * Data source item for dropdowns and radio buttons
 */
const dataSourceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  metadata: z.string().optional(),
});

/**
 * On-click action schema for interactive components
 */
const onClickActionSchema = z.object({
  name: z.enum(['navigate', 'complete', 'data_exchange']),
  next: z
    .object({
      type: z.literal('screen'),
      name: z.string(),
    })
    .optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Base component schema with common properties
 */
const baseComponentSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
  visible: z.boolean().optional(),
  enabled: z.boolean().optional(),
  'init-value': z.union([z.string(), z.number(), z.boolean()]).optional(),
  'helper-text': z.string().optional(),
  'on-click-action': onClickActionSchema.optional(),
  'data-source': z.array(dataSourceItemSchema).optional(),
});

/**
 * Screen component schema with all WhatsApp Flow component types
 * Allows additional properties for component-specific fields
 */
const screenComponentSchema = baseComponentSchema.catchall(z.unknown());

/**
 * Layout schema for screen structure
 */
const layoutSchema = z.object({
  type: z.enum(['SingleColumnLayout', 'Form']),
  children: z.array(screenComponentSchema).min(1, 'Layout must have at least one child component'),
});

// =============================================================================
// Screen Schema
// =============================================================================

/**
 * WhatsApp Flow screen schema
 */
const flowScreenSchema = z.object({
  id: z.string().min(1, 'Screen ID is required').max(50, 'Screen ID too long'),
  title: z.string().min(1, 'Screen title is required').max(80, 'Screen title too long'),
  terminal: z.boolean().optional(),
  success: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  layout: layoutSchema,
  refresh_on_back: z.boolean().optional(),
});

// =============================================================================
// Flow JSON Schema
// =============================================================================

/**
 * Complete WhatsApp Flow JSON schema
 * Reference: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
 */
const flowJsonSchema = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+$/, { message: 'Version must be in format X.Y (e.g., 7.2)' })
    .refine(
      (val) => {
        const [major] = val.split('.').map(Number);
        return major >= 2 && major <= 7;
      },
      { message: 'Version major number must be between 2 and 7' }
    ),
  screens: z
    .array(flowScreenSchema)
    .min(1, 'Flow must have at least one screen')
    .max(20, 'Flow can have maximum 20 screens'),
  data_channel_uri: z.string().url().optional(),
});

// =============================================================================
// Flow CRUD Schemas
// =============================================================================

/**
 * Create Flow DTO Schema
 */
export const createFlowSchema = z.object({
  name: z
    .string()
    .min(1, 'Flow name is required')
    .max(255, 'Flow name too long')
    .regex(/^[a-zA-Z0-9-_\s]+$/, {
      message:
        'Flow name can only contain alphanumeric characters, hyphens, underscores, and spaces',
    }),
  version: z
    .string()
    .regex(/^\d+\.\d+$/, { message: 'Version must be in format X.Y' })
    .optional()
    .default('7.2'),
  flowJson: flowJsonSchema,
  description: z.string().max(1000, 'Description too long').optional(),
  status: z.enum(['active', 'inactive', 'deprecated']).optional().default('active'),
  metaFlowId: z.string().max(255).optional(),
  templateName: z.string().max(255).optional(),
});

/**
 * Update Flow DTO Schema
 */
export const updateFlowSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Flow name is required')
      .max(255, 'Flow name too long')
      .regex(/^[a-zA-Z0-9-_\s]+$/, {
        message:
          'Flow name can only contain alphanumeric characters, hyphens, underscores, and spaces',
      })
      .optional(),
    version: z
      .string()
      .regex(/^\d+\.\d+$/, { message: 'Version must be in format X.Y' })
      .optional(),
    flowJson: flowJsonSchema.optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    status: z.enum(['active', 'inactive', 'deprecated']).optional(),
    metaFlowId: z.string().max(255).optional(),
    templateName: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// =============================================================================
// Flow Request/Response Schemas (Endpoint)
// =============================================================================

/**
 * Flow endpoint request schema (encrypted payload)
 */
export const flowRequestSchema = z.object({
  encrypted_aes_key: z.string().min(1, 'Encrypted AES key is required'),
  encrypted_flow_data: z.string().min(1, 'Encrypted flow data is required'),
  initial_vector: z.string().min(1, 'Initial vector is required'),
});

/**
 * Flow endpoint response schema
 */
export const flowResponseSchema = z.object({
  encrypted_flow_data_b64: z.string().min(1),
  encrypted_aes_key: z.string().optional(),
  initial_vector_b64: z.string().min(1),
});

/**
 * Decrypted flow data schema (from encrypted_flow_data)
 */
export const decryptedFlowDataSchema = z.object({
  version: z.string(),
  screen: z.string(),
  data: z.record(z.string(), z.unknown()),
  flow_token: z.string(),
});

// =============================================================================
// Webhook Schemas
// =============================================================================

/**
 * WhatsApp webhook nfm_reply schema
 */
const nfmReplySchema = z.object({
  response_json: z.string(), // IMPORTANT: This is a STRING, not an object
  body: z.string(),
  name: z.string(),
});

/**
 * WhatsApp webhook interactive message schema
 */
const interactiveSchema = z.object({
  type: z.literal('nfm_reply'),
  nfm_reply: nfmReplySchema,
});

/**
 * WhatsApp webhook message schema
 */
const messageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  interactive: interactiveSchema.optional(),
});

/**
 * WhatsApp webhook contact schema
 */
const contactSchema = z.object({
  profile: z.object({
    name: z.string(),
  }),
  wa_id: z.string(),
});

/**
 * WhatsApp webhook metadata schema
 */
const metadataSchema = z.object({
  display_phone_number: z.string(),
  phone_number_id: z.string(),
});

/**
 * WhatsApp webhook value schema
 */
const valueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: metadataSchema,
  contacts: z.array(contactSchema).optional(),
  messages: z.array(messageSchema).optional(),
});

/**
 * WhatsApp webhook change schema
 */
const changeSchema = z.object({
  value: valueSchema,
  field: z.string(),
});

/**
 * WhatsApp webhook entry schema
 */
const entrySchema = z.object({
  id: z.string(),
  changes: z.array(changeSchema),
});

/**
 * Complete WhatsApp webhook event schema
 */
export const webhookEventSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(entrySchema).min(1),
});

/**
 * Webhook verification schema (GET request)
 */
export const webhookVerificationSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

// =============================================================================
// Utility Schemas
// =============================================================================

/**
 * UUID parameter schema
 */
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Flow filter query schema
 */
export const flowFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'deprecated']).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;
export type FlowRequestInput = z.infer<typeof flowRequestSchema>;
export type FlowResponseOutput = z.infer<typeof flowResponseSchema>;
export type DecryptedFlowData = z.infer<typeof decryptedFlowDataSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type WebhookVerification = z.infer<typeof webhookVerificationSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type FlowFilterQuery = z.infer<typeof flowFilterSchema>;
