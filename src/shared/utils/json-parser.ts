import { ValidationError } from '../errors/ValidationError';

/**
 * Safe JSON Parser
 */
export class JsonParser {
  /**
   * Parse JSON string safely
   * @throws ValidationError if parsing fails
   */
  static parse<T = any>(jsonString: string, context?: string): T {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      const message = context ? `Failed to parse JSON in ${context}` : 'Failed to parse JSON';
      throw new ValidationError(message, {
        originalError: error instanceof Error ? error.message : String(error),
        input: jsonString.substring(0, 100), // First 100 chars for debugging
      });
    }
  }

  /**
   * Parse JSON string and return null if fails
   */
  static safeParse<T = any>(jsonString: string): T | null {
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return null;
    }
  }

  /**
   * Stringify with error handling
   */
  static stringify(data: any, pretty: boolean = false): string {
    try {
      return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    } catch (error) {
      throw new ValidationError('Failed to stringify data', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
