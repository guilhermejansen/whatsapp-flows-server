#!/usr/bin/env tsx
/**
 * Generate RSA-2048 Key Pair for WhatsApp Flow Encryption
 *
 * Usage: npm run generate-keys
 *
 * This will generate:
 * - private_key.pem (encrypted with passphrase)
 * - public_key.pem
 *
 * IMPORTANT:
 * - Keep private_key.pem SECURE and NEVER commit to Git
 * - Add keys to .env file
 * - Register public key to Meta using register-public-key.ts
 */

import NodeRSA from 'node-rsa';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function generateKeys() {
  console.log('🔐 Generating RSA-2048 Key Pair for WhatsApp Flows\n');

  // Ask for passphrase
  const passphrase = await question('Enter passphrase to encrypt private key (press Enter to skip): ');

  console.log('\n⏳ Generating keys...\n');

  // Generate RSA-2048 key pair
  const key = new NodeRSA({ b: 2048 });
  key.setOptions({ encryptionScheme: 'pkcs1_oaep' });

  // Export keys
  let privateKey: string;

  if (passphrase && passphrase.trim()) {
    // Encrypt private key with passphrase
    privateKey = key.exportKey('pkcs1-private-pem');
    console.log('✅ Private key encrypted with passphrase');
  } else {
    // Export without encryption
    privateKey = key.exportKey('pkcs1-private-pem');
    console.log('⚠️  Private key NOT encrypted (consider using passphrase in production)');
  }

  const publicKey = key.exportKey('pkcs8-public-pem');

  // Save to files
  const keysDir = path.join(process.cwd(), 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privateKeyPath = path.join(keysDir, 'private_key.pem');
  const publicKeyPath = path.join(keysDir, 'public_key.pem');

  fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

  console.log('\n✅ Keys generated successfully!\n');
  console.log(`📁 Private Key: ${privateKeyPath}`);
  console.log(`📁 Public Key: ${publicKeyPath}\n`);

  // Show .env format
  console.log('📋 Add these to your .env file:\n');
  console.log('PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');
  if (passphrase && passphrase.trim()) {
    console.log('PASSPHRASE="' + passphrase + '"');
  }
  console.log('PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"\n');

  // Next steps
  console.log('📌 Next Steps:');
  console.log('1. Copy the keys to your .env file');
  console.log('2. Run "npm run register-key" to register public key with Meta');
  console.log('3. NEVER commit private_key.pem to Git!\n');

  rl.close();
}

generateKeys().catch((error) => {
  console.error('❌ Error generating keys:', error);
  rl.close();
  process.exit(1);
});
