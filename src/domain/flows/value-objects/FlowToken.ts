import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * FlowToken Value Object
 * Immutable identifier for a Flow session
 */
export class FlowToken {
  private readonly value: string;

  constructor(token: string) {
    if (!token || token.trim().length === 0) {
      throw new ValidationError('Flow token cannot be empty');
    }

    if (token.length > 500) {
      throw new ValidationError('Flow token too long (max 500 characters)');
    }

    this.value = token.trim();
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: FlowToken): boolean {
    return this.value === other.value;
  }

  static fromString(token: string): FlowToken {
    return new FlowToken(token);
  }
}
