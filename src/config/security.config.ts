import { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { env } from './env.config';

/**
 * CORS Configuration
 */
export const getCorsOptions = (): CorsOptions => {
  const origins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins if CORS_ORIGINS is '*'
      if (origins.includes('*')) {
        return callback(null, true);
      }

      // Check if origin is in whitelist
      if (origins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature-256'],
  };
};

/**
 * Helmet Security Headers Configuration
 */
export const getHelmetOptions = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
};

/**
 * Rate Limiting Configuration
 */
export const getRateLimiter = (): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health check
    skip: (req) => req.path === '/health',
    // Validate trust proxy to prevent IP spoofing
    validate: { trustProxy: false },
  });
};

/**
 * Webhook-specific Rate Limiter (more permissive)
 */
export const getWebhookRateLimiter = (): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: 60000, // 1 minute
    max: 500, // Higher limit for webhooks
    message: {
      success: false,
      error: {
        message: 'Webhook rate limit exceeded',
        code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });
};

/**
 * Flow Endpoint Rate Limiter (strict SLA requirements)
 */
export const getFlowEndpointRateLimiter = (): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: 60000, // 1 minute
    max: 300, // Balance between protection and availability
    message: {
      success: false,
      error: {
        message: 'Flow endpoint rate limit exceeded',
        code: 'FLOW_RATE_LIMIT_EXCEEDED',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });
};
