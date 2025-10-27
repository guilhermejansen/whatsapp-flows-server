import { Pool, PoolConfig } from 'pg';
import { env } from './env.config';

/**
 * PostgreSQL Connection Pool Configuration
 */
export const getDatabaseConfig = (): PoolConfig => {
  // Use DATABASE_URL if available, otherwise use individual params
  if (env.DATABASE_URL) {
    return {
      connectionString: env.DATABASE_URL,
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

/**
 * Create and export database pool
 */
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(getDatabaseConfig());

    // Handle errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      process.exit(-1);
    });

    // Log connection
    pool.on('connect', () => {
      if (env.NODE_ENV === 'development') {
        console.log('✅ Database connection established');
      }
    });
  }

  return pool;
};

/**
 * Close database pool
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Database pool closed');
  }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};
