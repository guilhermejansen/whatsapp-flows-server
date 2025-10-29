#!/usr/bin/env tsx
/**
 * Run Database Migrations
 *
 * Usage: npm run migrate
 *
 * Prerequisites:
 * - PostgreSQL database created
 * - .env file configured with DATABASE_URL or DB_* variables
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const migrationsDir = path.join(__dirname);
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found');
    await pool.end();
    return;
  }

  console.log(`Found ${migrationFiles.length} migration(s):\n`);
  migrationFiles.forEach((file) => console.log(`  - ${file}`));
  console.log('');

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`⏳ Running ${file}...`);

      await pool.query(sql);

      console.log(`✅ ${file} completed\n`);
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('');

    // Show tables
    try {
      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      if (tablesResult.rows.length > 0) {
        const tableNames = tablesResult.rows.map((row) => row.table_name).join(', ');
        console.log('📋 Database tables: ' + tableNames);
      } else {
        console.log('⚠️  No tables found in database');
      }
      console.log('');
    } catch (tableError) {
      console.warn(
        '⚠️  Could not list tables:',
        tableError instanceof Error ? tableError.message : String(tableError)
      );
      console.log('');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
