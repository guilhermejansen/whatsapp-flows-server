import { AppError } from './AppError';

/**
 * Encryption/Decryption Error
 */
export class EncryptionError extends AppError {
  constructor(message: string, details?: any) {
    super(`Encryption Error: ${message}`, 500, false, details);
  }
}

/**
 * Decryption Error
 */
export class DecryptionError extends AppError {
  constructor(message: string, details?: any) {
    super(`Decryption Error: ${message}`, 400, true, details);
  }
}

/**
 * Invalid Signature Error
 */
export class InvalidSignatureError extends AppError {
  constructor(message: string = 'Invalid signature') {
    super(message, 401, true);
  }
}
