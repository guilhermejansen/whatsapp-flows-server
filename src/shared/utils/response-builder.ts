import { Response } from 'express';

/**
 * Standard API Response Builder
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export class ResponseBuilder {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T): Response {
    return ResponseBuilder.success(res, data, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(res: Response, message: string, details?: any): Response {
    return ResponseBuilder.error(res, message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return ResponseBuilder.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return ResponseBuilder.error(res, message, 403, 'FORBIDDEN');
  }

  static notFound(res: Response, resource: string): Response {
    return ResponseBuilder.error(res, `${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(res: Response, message: string): Response {
    return ResponseBuilder.error(res, message, 409, 'CONFLICT');
  }

  static internalError(res: Response, message: string = 'Internal server error'): Response {
    return ResponseBuilder.error(res, message, 500, 'INTERNAL_ERROR');
  }
}
