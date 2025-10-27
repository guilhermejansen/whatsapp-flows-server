import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * EncryptedPayload Value Object
 * Represents encrypted Flow request from WhatsApp
 */
export class EncryptedPayload {
  constructor(
    public readonly encryptedAesKey: string,
    public readonly encryptedFlowData: string,
    public readonly initialVector: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.encryptedAesKey || this.encryptedAesKey.trim().length === 0) {
      throw new ValidationError('Encrypted AES key cannot be empty');
    }

    if (!this.encryptedFlowData || this.encryptedFlowData.trim().length === 0) {
      throw new ValidationError('Encrypted flow data cannot be empty');
    }

    if (!this.initialVector || this.initialVector.trim().length === 0) {
      throw new ValidationError('Initial vector cannot be empty');
    }
  }

  static fromRequest(request: {
    encrypted_aes_key: string;
    encrypted_flow_data: string;
    initial_vector: string;
  }): EncryptedPayload {
    return new EncryptedPayload(
      request.encrypted_aes_key,
      request.encrypted_flow_data,
      request.initial_vector
    );
  }
}
