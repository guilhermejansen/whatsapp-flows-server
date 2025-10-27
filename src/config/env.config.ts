import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Environment Configuration Schema with Zod v4 Validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  FLOW_ENDPOINT_TIMEOUT: z.coerce.number().int().positive().default(2500),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('whatsapp_flows'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Encryption
  PRIVATE_KEY: z.string().min(1, 'PRIVATE_KEY is required'),
  PASSPHRASE: z.string().optional(),
  PUBLIC_KEY: z.string().min(1, 'PUBLIC_KEY is required'),

  // Meta/WhatsApp
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET is required'),
  META_VERIFY_TOKEN: z.string().min(1, 'META_VERIFY_TOKEN is required'),
  META_ACCESS_TOKEN: z.string().min(1, 'META_ACCESS_TOKEN is required'),
  META_PHONE_NUMBER_ID: z.string().min(1, 'META_PHONE_NUMBER_ID is required'),
  META_WABA_ID: z.string().min(1, 'META_WABA_ID is required'),

  // Callback
  CALLBACK_WEBHOOK_URL: z.string().url('CALLBACK_WEBHOOK_URL must be a valid URL'),
  CALLBACK_TIMEOUT: z.coerce.number().int().positive().default(5000),
  CALLBACK_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),

  // Security
  API_TOKEN: z.string().optional(), // Optional API token for CRUD endpoints authentication
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('debug'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
  LOG_MAX_FILES: z.coerce.number().int().positive().default(7),

  // Flow Configuration
  DEFAULT_FLOW_NAME: z.string().default('csat-feedback'),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === 'test';
