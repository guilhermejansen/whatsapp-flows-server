#!/usr/bin/env tsx
/** Generate an RSA-2048 pair without printing private material. */
import { generateKeyPairSync } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { Writable } from 'node:stream';

async function readPassphrase(): Promise<string> {
  // readline echoes terminal input through its output stream. Mute that stream
  // while reading the secret, including terminal redraws and cursor movement.
  const terminal = process.stdin.isTTY === true;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!terminal) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal });
  process.stdout.write('Enter passphrase to encrypt private key (press Enter to skip): ');
  try {
    return await new Promise<string>((resolve, reject) => {
      rl.once('close', () =>
        reject(new Error('Passphrase input closed before a line was received'))
      );
      rl.question('', resolve);
    });
  } finally {
    rl.close();
    if (terminal) process.stdout.write('\n');
  }
}

async function generateKeys(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--force')) {
    throw new Error('Usage: npm run generate-keys -- [--force]');
  }
  const force = args.includes('--force');
  const keysDir = path.join(process.cwd(), 'keys');
  fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
  if (!fs.lstatSync(keysDir).isDirectory()) throw new Error('keys must be a real directory');
  const privateKeyPath = path.join(keysDir, 'private_key.pem');
  const publicKeyPath = path.join(keysDir, 'public_key.pem');
  for (const filename of [privateKeyPath, publicKeyPath]) {
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(filename);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    if (!force)
      throw new Error('Key file already exists; use --force only for deliberate key rotation');
    if (!stat.isFile()) throw new Error('Refusing to replace a non-regular key file');
  }

  const passphrase = await readPassphrase();
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privatePem =
    passphrase.length > 0
      ? privateKey.export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase })
      : privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

  // Write new inodes before publishing: --force never follows an old symlink
  // or preserves an old permissive mode. Each rename is atomic, not the pair.
  const staging = fs.mkdtempSync(path.join(keysDir, '.key-pair-'));
  let privateCreated = false;
  try {
    const stagedPrivate = path.join(staging, 'private.pem');
    const stagedPublic = path.join(staging, 'public.pem');
    fs.writeFileSync(stagedPrivate, privatePem, { mode: 0o600, flag: 'wx' });
    fs.chmodSync(stagedPrivate, 0o600);
    fs.writeFileSync(stagedPublic, publicPem, { mode: 0o644, flag: 'wx' });
    if (force) {
      fs.renameSync(stagedPrivate, privateKeyPath);
      fs.renameSync(stagedPublic, publicKeyPath);
    } else {
      // Hard links fail with EEXIST even if a file appeared after preflight.
      fs.linkSync(stagedPrivate, privateKeyPath);
      privateCreated = true;
      fs.linkSync(stagedPublic, publicKeyPath);
    }
  } catch (error) {
    if (privateCreated) fs.unlinkSync(privateKeyPath);
    throw error;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }

  console.log(
    passphrase.length > 0
      ? '\nPrivate key encrypted (PKCS#8 / AES-256-CBC).'
      : '\nPrivate key is NOT encrypted.'
  );
  console.log(`Private key saved to: ${privateKeyPath}`);
  console.log(`Public key saved to: ${publicKeyPath}`);
  console.log(publicPem.toString());
  console.log(
    'Keep the private file and passphrase secret; configure PRIVATE_KEY and PASSPHRASE securely.'
  );
}

generateKeys().catch((error: unknown) => {
  console.error('Key generation failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
