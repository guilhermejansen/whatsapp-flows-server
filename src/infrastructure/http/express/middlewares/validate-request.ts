import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ResponseBuilder } from '../../../../shared/utils/response-builder';

/**
 * Validate Request Middleware
 * Validates request body/query/params against Zod v4 schema
 */
export function validateRequest(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
        ResponseBuilder.badRequest(res, 'Validation failed', {
          errors: messages,
        });
      } else {
        ResponseBuilder.badRequest(res, 'Invalid request');
      }
    }
  };
}
