import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * FlowVersion Value Object
 * Represents WhatsApp Flow version (e.g., "7.2")
 */
export class FlowVersion {
  private readonly major: number;
  private readonly minor: number;

  constructor(version: string) {
    const match = version.match(/^(\d+)\.(\d+)$/);

    if (!match) {
      throw new ValidationError('Flow version must be in format X.Y (e.g., 7.2)');
    }

    this.major = parseInt(match[1], 10);
    this.minor = parseInt(match[2], 10);
  }

  public toString(): string {
    return `${this.major}.${this.minor}`;
  }

  public getMajor(): number {
    return this.major;
  }

  public getMinor(): number {
    return this.minor;
  }

  public equals(other: FlowVersion): boolean {
    return this.major === other.major && this.minor === other.minor;
  }

  public isGreaterThan(other: FlowVersion): boolean {
    if (this.major > other.major) return true;
    if (this.major === other.major && this.minor > other.minor) return true;
    return false;
  }

  static fromString(version: string): FlowVersion {
    return new FlowVersion(version);
  }

  static default(): FlowVersion {
    return new FlowVersion('7.2');
  }
}
