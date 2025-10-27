/**
 * Encryption Service Interface
 * Handles RSA + AES encryption/decryption with IV FLIP
 */
export interface IEncryptionService {
  /**
   * Decrypt incoming request from WhatsApp
   * Uses IV without flip (normal)
   */
  decryptRequest(encryptedAesKey: string, encryptedFlowData: string, initialVector: string): any;

  /**
   * Encrypt outgoing response to WhatsApp
   * Uses IV WITH FLIP (reversed)
   * Returns ONLY the base64 string (WhatsApp format)
   */
  encryptResponse(responsePayload: any, aesKey: Buffer, initialVector: string): string;

  /**
   * Decrypt AES key with RSA private key
   */
  decryptAesKey(encryptedAesKey: string): Buffer;
}
