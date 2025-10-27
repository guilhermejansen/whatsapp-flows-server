import { FlowAction, isValidFlowAction } from '../../../shared/constants/flow-actions';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * DecryptedPayload Value Object
 * Represents decrypted Flow request data
 */
export class DecryptedPayload {
  constructor(
    public readonly action: FlowAction,
    public readonly flowToken: string,
    public readonly screen?: string,
    public readonly data?: Record<string, any>,
    public readonly version?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!isValidFlowAction(this.action)) {
      throw new ValidationError(`Invalid action: ${this.action}`);
    }

    if (!this.flowToken || this.flowToken.trim().length === 0) {
      throw new ValidationError('Flow token cannot be empty');
    }
  }

  static fromDecrypted(decrypted: any): DecryptedPayload {
    return new DecryptedPayload(
      decrypted.action,
      decrypted.flow_token,
      decrypted.screen,
      decrypted.data,
      decrypted.version
    );
  }
}
