#!/usr/bin/env tsx
/** Exit zero only when local pairing AND remote key equality are verified. */
import axios from 'axios';
import * as crypto from 'node:crypto';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

class ValidationError extends Error {}

async function validateKeys(): Promise<void> {
  const privateKeyRaw = process.env.PRIVATE_KEY;
  const publicKeyRaw = process.env.PUBLIC_KEY;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!privateKeyRaw || !publicKeyRaw) throw new ValidationError('Local keys are not configured');

  const privateKey = crypto.createPrivateKey({
    key: privateKeyRaw.replace(/\\n/g, '\n'),
    passphrase: process.env.PASSPHRASE,
  });
  const publicKey = crypto.createPublicKey(publicKeyRaw.replace(/\\n/g, '\n'));
  const testData = crypto.randomBytes(32);
  const encrypted = crypto.publicEncrypt({ key: publicKey, oaepHash: 'sha256' }, testData);
  const decrypted = crypto.privateDecrypt({ key: privateKey, oaepHash: 'sha256' }, encrypted);
  if (!testData.equals(decrypted)) throw new ValidationError('Local key pair does not match');
  console.log('Local key pair verified.');

  if (!accessToken || !phoneNumberId) {
    throw new ValidationError('Meta registration UNVERIFIED: credentials are not configured');
  }
  let data: { business_public_key?: unknown; public_key?: unknown };
  try {
    const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(phoneNumberId)}/whatsapp_business_encryption`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
      maxRedirects: 0,
    });
    data = response.data;
  } catch {
    // Axios errors may include Authorization headers. Never dump the error.
    throw new ValidationError('Meta registration UNVERIFIED: HTTP request failed');
  }
  const registeredKey = data?.business_public_key || data?.public_key;
  if (typeof registeredKey !== 'string' || !registeredKey.trim()) {
    throw new ValidationError('Meta registration UNVERIFIED: response contains no public key');
  }
  let registeredDer: Buffer;
  try {
    registeredDer = crypto.createPublicKey(registeredKey).export({ type: 'spki', format: 'der' });
  } catch {
    throw new ValidationError('Meta registration UNVERIFIED: invalid public key in response');
  }
  const localDer = publicKey.export({ type: 'spki', format: 'der' });
  if (!localDer.equals(registeredDer))
    throw new ValidationError('Registered Meta public key DOES NOT MATCH local key');
  console.log('Registered key in Meta MATCHES local public key. All key validations passed.');
}

validateKeys().catch((error: unknown) => {
  // Do not serialize key parsing errors or request objects containing secrets.
  console.error(
    'Key validation failed:',
    error instanceof ValidationError
      ? error.message
      : 'Local key pair could not be loaded or verified.'
  );
  process.exitCode = 1;
});
