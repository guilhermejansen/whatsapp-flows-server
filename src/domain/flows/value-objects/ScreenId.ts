import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * ScreenId Value Object
 * Immutable identifier for a Flow screen
 */
export class ScreenId {
  private readonly value: string;

  constructor(screenId: string) {
    if (!screenId || screenId.trim().length === 0) {
      throw new ValidationError('Screen ID cannot be empty');
    }

    if (screenId.length > 255) {
      throw new ValidationError('Screen ID too long (max 255 characters)');
    }

    this.value = screenId.trim();
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: ScreenId): boolean {
    return this.value === other.value;
  }

  static fromString(screenId: string): ScreenId {
    return new ScreenId(screenId);
  }
}
