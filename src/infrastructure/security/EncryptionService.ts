import * as crypto from 'crypto';
import { IEncryptionService } from '../../domain/encryption/services/IEncryptionService';
import { EncryptionError, DecryptionError } from '../../shared/errors/EncryptionError';
import { logger } from '../logging/winston-logger';

/**
 * Encryption Service - Using Node.js native crypto (compatible with WhatsApp)
 *
 * This implementation matches the official WhatsApp Flow examples
 * Uses crypto.privateDecrypt() instead of node-rsa
 *
 * CRITICAL: Implements IV FLIP for WhatsApp Flow encryption
 * - Decrypt (incoming): Use IV as-is (normal)
 * - Encrypt (outgoing): Use FLIPPED IV (bitwise NOT operation)
 *
 * Ref: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint/
 */
export class EncryptionService implements IEncryptionService {
  private privateKey: crypto.KeyObject;

  constructor(privateKeyPem: string, passphrase?: string) {
    try {
      this.privateKey = crypto.createPrivateKey({
        key: privateKeyPem,
        passphrase: passphrase,
      });

      logger.info('✅ Private key loaded with native crypto');
    } catch (error) {
      throw new EncryptionError('Failed to load private key', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Decrypt AES key with RSA private key
   * Uses RSA_PKCS1_OAEP_PADDING with SHA256 (WhatsApp standard)
   */
  public decryptAesKey(encryptedAesKey: string): Buffer {
    try {
      const encryptedBuffer = Buffer.from(encryptedAesKey, 'base64');

      logger.debug('🔐 Attempting to decrypt AES key with native crypto', {
        encryptedSize: encryptedBuffer.length,
        encryptedKeyPreview: encryptedAesKey.substring(0, 50) + '...',
      });

      // Decrypt using Node.js native crypto (same as WhatsApp example)
      const decryptedAesKey = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer
      );

      logger.info('✅ AES key decrypted successfully with native crypto', {
        decryptedSize: decryptedAesKey.length,
      });

      return decryptedAesKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('❌ Failed to decrypt AES key', {
        error: errorMessage,
      });

      // If decryption fails, return 421 to force client to refresh public key
      throw new DecryptionError('Failed to decrypt the request. Please verify your private key.', {
        originalError: errorMessage,
        statusCode: 421, // Tell WhatsApp to refresh the public key
        hint: 'This usually means the public key registered in Meta does not match the private key on this server.',
      });
    }
  }

  /**
   * Decrypt incoming request from WhatsApp
   * Uses IV WITHOUT flip (normal)
   */
  public decryptRequest(
    encryptedAesKey: string,
    encryptedFlowData: string,
    initialVector: string
  ): any {
    try {
      // 1. Decrypt AES key with RSA
      const decryptedAesKey = this.decryptAesKey(encryptedAesKey);

      // 2. Prepare buffers
      const flowDataBuffer = Buffer.from(encryptedFlowData, 'base64');
      const initialVectorBuffer = Buffer.from(initialVector, 'base64');

      // 3. Extract authentication tag (last 16 bytes)
      const TAG_LENGTH = 16;
      const encryptedFlowDataBody = flowDataBuffer.subarray(0, -TAG_LENGTH);
      const encryptedFlowDataTag = flowDataBuffer.subarray(-TAG_LENGTH);

      // 4. Decrypt with AES-128-GCM (IV normal, without flip)
      const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer);
      decipher.setAuthTag(encryptedFlowDataTag);

      const decryptedJSONString = Buffer.concat([
        decipher.update(encryptedFlowDataBody),
        decipher.final(),
      ]).toString('utf-8');

      logger.info('✅ Request decrypted successfully');

      return JSON.parse(decryptedJSONString);
    } catch (error) {
      throw new DecryptionError('Failed to decrypt request', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Encrypt outgoing response to WhatsApp
   * Uses IV WITH FLIP (reversed) - CRITICAL!
   * Returns ONLY the base64 string (WhatsApp format)
   */
  public encryptResponse(responsePayload: any, aesKey: Buffer, initialVector: string): string {
    try {
      const plaintext = JSON.stringify(responsePayload);
      const initialVectorBuffer = Buffer.from(initialVector, 'base64');

      // ⚠️ CRITICAL: FLIP THE IV!
      // Same logic as WhatsApp example: flip each byte using bitwise NOT
      const flippedIV = [];
      for (const [, byte] of initialVectorBuffer.entries()) {
        flippedIV.push(~byte);
      }

      logger.debug('🔄 Flipping IV for encryption', {
        originalIV: initialVectorBuffer.toString('hex'),
        flippedIV: Buffer.from(flippedIV).toString('hex'),
      });

      // Encrypt with AES-128-GCM using FLIPPED IV
      const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, Buffer.from(flippedIV));

      const encryptedData = Buffer.concat([
        cipher.update(plaintext, 'utf-8'),
        cipher.final(),
        cipher.getAuthTag(),
      ]);

      logger.info('✅ Response encrypted successfully');

      // Return ONLY the base64 string (same as WhatsApp example)
      return encryptedData.toString('base64');
    } catch (error) {
      throw new EncryptionError('Failed to encrypt response', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
