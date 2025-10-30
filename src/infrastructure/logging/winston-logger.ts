import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '../../config/env.config';

/**
 * Winston Logger Configuration
 */

// Ensure logs directory exists
const logsDir = path.dirname(env.LOG_FILE_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [
  // File transport - all levels
  new winston.transports.File({
    filename: env.LOG_FILE_PATH,
    level: env.LOG_LEVEL,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: env.LOG_MAX_FILES,
    format: customFormat,
  }),

  // File transport - errors only
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: env.LOG_MAX_FILES,
    format: customFormat,
  }),

  // Console transport - ALWAYS enabled for Docker logs (stdout/stderr)
  // Uses colorized format in development, JSON in production
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? customFormat : consoleFormat,
    level: env.LOG_LEVEL,
  }),
];

// Create logger
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Log unhandled rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default logger;
