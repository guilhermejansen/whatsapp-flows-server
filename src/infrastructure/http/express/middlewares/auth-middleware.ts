import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../../shared/errors/ValidationError';
import { env } from '../../../../config/env.config';
import { logger } from '../../../logging/winston-logger';

/**
 * Authentication Middleware
 *
 * Validates API token in Authorization header
 * Format: "Authorization: Bearer <token>"
 *
 * NOTE: This is a basic implementation. In production, use JWT, OAuth, or similar.
 */
export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Missing authentication token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      throw new UnauthorizedError('Authentication token required');
    }

    // Get API token from environment
    // In production, you would validate JWT or OAuth token here
    const validToken = process.env.API_TOKEN || env.META_ACCESS_TOKEN;

    if (token !== validToken) {
      logger.warn('Invalid authentication token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      throw new UnauthorizedError('Invalid authentication token');
    }

    // Token is valid, proceed
    logger.debug('Authentication successful', {
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization Middleware - Check user roles
 *
 * NOTE: This is a placeholder. In production, implement proper role-based access control.
 *
 * @param allowedRoles - Array of roles that can access the resource
 */
export function authorizeRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // In production, extract user role from JWT token or session
    // For now, assume all authenticated users have 'admin' role
    const userRole = 'admin'; // Placeholder

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        path: req.path,
        method: req.method,
        userRole,
        requiredRoles: allowedRoles,
      });
      throw new UnauthorizedError('Insufficient permissions');
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Authenticates if token is present, but doesn't fail if missing
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // If token is present, validate it
    authenticateToken(req, res, next);
  } else {
    // No token, proceed without authentication
    next();
  }
}
