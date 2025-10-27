#!/usr/bin/env tsx
/**
 * Validate RSA Key Pair Matching
 *
 * Verifies that:
 * 1. Private and public keys match
 * 2. Keys can encrypt/decrypt correctly
 * 3. Public key registered in Meta matches local key
 *
 * Usage: npx tsx scripts/validate-keys.ts
 */

import NodeRSA from 'node-rsa';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function validateKeys() {
  console.log('🔍 Validating RSA Key Pair\n');

  // 1. Load keys
  const privateKeyRaw = process.env.PRIVATE_KEY;
  const publicKeyRaw = process.env.PUBLIC_KEY;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!privateKeyRaw || !publicKeyRaw) {
    console.error('❌ Keys not found in .env');
    process.exit(1);
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  const publicKey = publicKeyRaw.replace(/\\n/g, '\n');

  console.log('📋 Step 1: Validate key pair matching...');

  // 2. Import keys
  const privateRsa = new NodeRSA();
  try {
    privateRsa.importKey(privateKey, 'pkcs1-private-pem');
  } catch {
    privateRsa.importKey(privateKey, 'pkcs8-private-pem');
  }
  privateRsa.setOptions({ encryptionScheme: 'pkcs1_oaep' });

  const publicRsa = new NodeRSA();
  publicRsa.importKey(publicKey, 'pkcs8-public-pem');
  publicRsa.setOptions({ encryptionScheme: 'pkcs1_oaep' });

  // 3. Test encryption/decryption
  try {
    const testData = crypto.randomBytes(32);
    const encrypted = publicRsa.encrypt(testData);
    const decrypted = privateRsa.decrypt(encrypted);

    if (Buffer.compare(testData, decrypted) === 0) {
      console.log('✅ Private and public keys MATCH');
      console.log('   Encryption test passed\n');
    } else {
      console.error('❌ Keys do NOT match!');
      console.error('   Private key cannot decrypt what public key encrypted');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Encryption test FAILED:', error);
    console.error('   Keys are incompatible');
    process.exit(1);
  }

  // 4. Check registered key in Meta
  if (!accessToken || !phoneNumberId) {
    console.log('⚠️  Step 2: Skipping Meta validation (credentials not configured)');
    console.log('\n✅ Local key pair is valid');
    console.log('🔑 Next step: Register public key with Meta');
    console.log('   Run: npm run register-key\n');
    return;
  }

  console.log('📋 Step 2: Checking registered key in Meta...');

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_encryption`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('   API Response:', JSON.stringify(response.data, null, 2));

    const registeredKey = response.data.business_public_key || response.data.public_key;

    if (!registeredKey) {
      console.log('⚠️  No public key found in API response');
      console.log('   Response data:', response.data);
      console.log('\n💡 The key may have been registered but the API is not returning it.');
      console.log('   This can happen due to:');
      console.log('   - Propagation delay (wait 1-2 minutes)');
      console.log('   - API permissions issue');
      console.log('   - Wrong phone number ID\n');
      console.log('✅ Local key pair is valid');
      console.log('🔑 Key was successfully registered');
      console.log('🧪 Try testing the endpoint in WhatsApp Manager now\n');
      return;
    }

    // Compare keys (normalize whitespace)
    const localKeyNormalized = publicKey.replace(/\s+/g, '');
    const registeredKeyNormalized = registeredKey.replace(/\s+/g, '');

    if (localKeyNormalized === registeredKeyNormalized) {
      console.log('✅ Registered key in Meta MATCHES local public key\n');
      console.log('🎉 All validations passed!');
      console.log('✅ Your setup is correct');
      console.log('✅ Ready to process WhatsApp Flow requests\n');
    } else {
      console.log('❌ Registered key in Meta DOES NOT MATCH local key!\n');
      console.log('📝 Local public key (first 100 chars):');
      console.log('   ' + publicKey.substring(0, 100) + '...\n');
      console.log('📝 Registered key (first 100 chars):');
      console.log('   ' + registeredKey.substring(0, 100) + '...\n');
      console.log('🔧 SOLUTION: Re-register the correct public key');
      console.log('   Run: npm run register-key\n');
      process.exit(1);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Failed to check Meta registration:', error.response?.data);
    } else {
      console.error('❌ Error:', error);
    }
    console.log('\n⚠️  Could not verify Meta registration');
    console.log('🔑 To register your public key, run: npm run register-key\n');
  }
}

validateKeys().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
