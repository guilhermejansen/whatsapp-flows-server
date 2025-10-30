import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { env, isProduction } from './env.config';

/**
 * Load package.json for dynamic project information
 */
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc annotations
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: packageJson.name || 'WhatsApp Flow Server',
    version: packageJson.version || '1.0.0',
    description: packageJson.description || 'WhatsApp Flow Server with DDD architecture',
    contact: {
      name: packageJson.author || 'API Support',
      email: 'suporte@setupautomatizado.com.br',
    },
    license: {
      name: packageJson.license || 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: isProduction
        ? `https://dev.setupautomatizado.com`
        : `http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`,
      description: isProduction ? 'Production Server' : 'Development Server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Flow Endpoint',
      description: 'WhatsApp Flow Data API - Encrypted flow interactions',
    },
    {
      name: 'Webhooks',
      description: 'WhatsApp webhook receiver for nfm_reply events',
    },
    {
      name: 'Flows',
      description: 'Flow CRUD operations (Admin)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'API token for authenticated endpoints',
      },
    },
    schemas: {
      // =================================================================
      // Flow Endpoint Schemas
      // =================================================================
      FlowRequest: {
        type: 'object',
        required: ['encrypted_aes_key', 'encrypted_flow_data', 'initial_vector'],
        properties: {
          encrypted_aes_key: {
            type: 'string',
            description: 'RSA-2048 encrypted AES-128 key (Base64)',
            example: 'kMgDf0h3K5aR...',
          },
          encrypted_flow_data: {
            type: 'string',
            description: 'AES-128-GCM encrypted flow data (Base64)',
            example: 'eyJ2ZXJzaW9uIjo...',
          },
          initial_vector: {
            type: 'string',
            description: 'AES-128-GCM initialization vector - 12 bytes (Base64)',
            example: 'MTIzNDU2Nzg5MDEy',
          },
        },
      },
      FlowResponse: {
        type: 'object',
        required: ['encrypted_flow_data_b64', 'initial_vector_b64'],
        properties: {
          encrypted_flow_data_b64: {
            type: 'string',
            description: 'AES-128-GCM encrypted response data (Base64)',
            example: 'eyJzY3JlZW4iOi...',
          },
          encrypted_aes_key: {
            type: 'string',
            description: 'RSA-2048 encrypted AES-128 key (Base64) - Only for INIT action',
            example: 'kMgDf0h3K5aR...',
          },
          initial_vector_b64: {
            type: 'string',
            description: 'AES-128-GCM initialization vector - 12 bytes (Base64)',
            example: 'MTIzNDU2Nzg5MDEy',
          },
        },
      },
      DecryptedFlowData: {
        type: 'object',
        description: 'Decrypted flow data structure (for documentation only)',
        properties: {
          version: {
            type: 'string',
            example: '3.0',
          },
          screen: {
            type: 'string',
            example: 'SCREEN_NAME',
          },
          data: {
            type: 'object',
            additionalProperties: true,
            example: { field1: 'value1' },
          },
          flow_token: {
            type: 'string',
            example: 'FLOW_TOKEN_VALUE',
          },
        },
      },
      // =================================================================
      // Webhook Schemas
      // =================================================================
      WebhookEvent: {
        type: 'object',
        required: ['object', 'entry'],
        properties: {
          object: {
            type: 'string',
            enum: ['whatsapp_business_account'],
            example: 'whatsapp_business_account',
          },
          entry: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '123456789',
                },
                changes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      value: {
                        type: 'object',
                        properties: {
                          messaging_product: {
                            type: 'string',
                            enum: ['whatsapp'],
                          },
                          metadata: {
                            type: 'object',
                            properties: {
                              display_phone_number: {
                                type: 'string',
                                example: '+1234567890',
                              },
                              phone_number_id: {
                                type: 'string',
                                example: '987654321',
                              },
                            },
                          },
                          messages: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                from: {
                                  type: 'string',
                                  example: '5511999999999',
                                },
                                id: {
                                  type: 'string',
                                  example: 'wamid.ABC123',
                                },
                                timestamp: {
                                  type: 'string',
                                  example: '1234567890',
                                },
                                type: {
                                  type: 'string',
                                  example: 'interactive',
                                },
                                interactive: {
                                  type: 'object',
                                  properties: {
                                    type: {
                                      type: 'string',
                                      enum: ['nfm_reply'],
                                    },
                                    nfm_reply: {
                                      type: 'object',
                                      properties: {
                                        response_json: {
                                          type: 'string',
                                          description: 'JSON string with flow response data',
                                          example: '{"field1":"value1"}',
                                        },
                                        body: {
                                          type: 'string',
                                          example: 'Sent',
                                        },
                                        name: {
                                          type: 'string',
                                          example: 'flow',
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      field: {
                        type: 'string',
                        example: 'messages',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // =================================================================
      // Flow CRUD Schemas
      // =================================================================
      FlowScreen: {
        type: 'object',
        required: ['id', 'title', 'layout'],
        properties: {
          id: {
            type: 'string',
            maxLength: 50,
            example: 'SCREEN_NAME',
          },
          title: {
            type: 'string',
            maxLength: 80,
            example: 'Screen Title',
          },
          terminal: {
            type: 'boolean',
            example: false,
          },
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            additionalProperties: true,
            example: {},
          },
          layout: {
            type: 'object',
            required: ['type', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['SingleColumnLayout', 'Form'],
                example: 'SingleColumnLayout',
              },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'WhatsApp Flow component',
                },
              },
            },
          },
        },
      },
      FlowJson: {
        type: 'object',
        required: ['version', 'screens'],
        properties: {
          version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
            example: '7.2',
          },
          screens: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: {
              $ref: '#/components/schemas/FlowScreen',
            },
          },
          routing_model: {
            type: 'object',
            description: 'Screen routing configuration',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            example: {
              SCREEN_1: ['SCREEN_2', 'SCREEN_3'],
              SCREEN_2: [],
            },
          },
          data_api_version: {
            type: 'string',
            example: '3.0',
          },
          data_channel_uri: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/flows/endpoint',
          },
        },
      },
      CreateFlowRequest: {
        type: 'object',
        required: ['name', 'flowJson'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            pattern: '^[a-zA-Z0-9-_\\s]+$',
            example: 'CSAT Feedback Flow',
          },
          version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
            default: '7.2',
            example: '7.2',
          },
          flowJson: {
            $ref: '#/components/schemas/FlowJson',
          },
          description: {
            type: 'string',
            maxLength: 1000,
            example: 'Customer satisfaction feedback flow',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'deprecated'],
            default: 'active',
            example: 'active',
          },
          metaFlowId: {
            type: 'string',
            maxLength: 255,
            example: '123456789012345',
          },
          templateName: {
            type: 'string',
            maxLength: 255,
            example: 'templates_csat_src_dev_1_0_UTILITY_99e0c',
          },
        },
      },
      UpdateFlowRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            pattern: '^[a-zA-Z0-9-_\\s]+$',
            example: 'Updated Flow Name',
          },
          version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
            example: '7.2',
          },
          flowJson: {
            $ref: '#/components/schemas/FlowJson',
          },
          description: {
            type: 'string',
            maxLength: 1000,
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'deprecated'],
          },
          metaFlowId: {
            type: 'string',
            maxLength: 255,
          },
          templateName: {
            type: 'string',
            maxLength: 255,
          },
        },
      },
      Flow: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          name: {
            type: 'string',
            example: 'CSAT Feedback Flow',
          },
          version: {
            type: 'string',
            example: '7.2',
          },
          flowJson: {
            $ref: '#/components/schemas/FlowJson',
          },
          description: {
            type: 'string',
            example: 'Customer satisfaction feedback flow',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'deprecated'],
            example: 'active',
          },
          metaFlowId: {
            type: 'string',
            example: '123456789012345',
          },
          templateName: {
            type: 'string',
            example: 'templates_csat_src_dev_1_0_UTILITY_99e0c',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      // =================================================================
      // Error Schemas
      // =================================================================
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'ValidationError',
          },
          message: {
            type: 'string',
            example: 'Invalid request data',
          },
          statusCode: {
            type: 'integer',
            example: 400,
          },
          details: {
            type: 'object',
            additionalProperties: true,
            example: { field: 'error description' },
          },
        },
      },
      // =================================================================
      // Success Schemas
      // =================================================================
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy'],
            example: 'healthy',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          uptime: {
            type: 'number',
            example: 12345.678,
          },
        },
      },
    },
  },
};

/**
 * Swagger JSDoc options
 *
 * In production, the application runs from compiled .js files in dist/
 * In development, we use the source .ts files in src/
 *
 * Uses absolute paths to ensure compatibility across different working directories
 */
const projectRoot = resolve(process.cwd());

const apiPaths = isProduction
  ? [
      join(projectRoot, 'dist/infrastructure/http/express/routes/*.js'),
      join(projectRoot, 'dist/infrastructure/http/express/controllers/*.js'),
    ]
  : [
      join(projectRoot, 'src/infrastructure/http/express/routes/*.ts'),
      join(projectRoot, 'src/infrastructure/http/express/controllers/*.ts'),
    ];

const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: apiPaths,
};

/**
 * Generate Swagger specification
 *
 * Note: This is generated once when the module is first imported.
 * The spec is cached by Node.js module system.
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
