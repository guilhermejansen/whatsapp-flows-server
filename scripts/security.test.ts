/**
 * Run only after the coordinator releases QA:
 *   node --import tsx --test scripts/security.test.ts
 *
 * Exercises the actual CLIs. Child output is deliberately never attached to an
 * assertion: a regression may print an ephemeral private key or passphrase.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(__dirname, '..');
const requireFromRepo = createRequire(path.join(repoRoot, 'package.json'));

type CliResult = { status: number; output: string };
type KeyPair = { privateKey: string; publicKey: string };
type RemoteReply = 'match' | 'alias' | 'absent' | 'blank' | 'mismatch' | 'http-error';

function temporaryDirectory(): { cwd: string; cleanup: () => void } {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'flows-security-'));
  return { cwd, cleanup: () => fs.rmSync(cwd, { recursive: true, force: true }) };
}

function ephemeralPair(passphrase?: string): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    privateKey: privateKey.export(
      passphrase
        ? { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
        : { type: 'pkcs1', format: 'pem' }
    ) as string,
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }) as string,
  };
}

function runCli(
  script: string,
  cwd: string,
  options: {
    input?: string;
    args?: string[];
    env?: Record<string, string>;
    preload?: string;
  } = {}
): CliResult {
  // Do not inherit .env, NODE_OPTIONS, proxies, tokens or production credentials.
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    SYSTEMROOT: process.env.SYSTEMROOT,
    TMPDIR: os.tmpdir(),
    NODE_ENV: 'test',
    DOTENV_CONFIG_QUIET: 'true',
    ...options.env,
  };
  const args = options.preload ? ['--require', options.preload] : [];
  args.push('--import', pathToFileURL(requireFromRepo.resolve('tsx')).href);
  args.push(path.join(repoRoot, 'scripts', script));
  args.push(...(options.args ?? []));
  const child = spawnSync(process.execPath, args, {
    cwd,
    env,
    input: options.input ?? '',
    encoding: 'utf8',
    timeout: 20_000,
    maxBuffer: 1024 * 1024,
  });
  // Never include child.error, stdout, stderr or environment values in failures.
  assert.ok(!child.error && child.signal === null, 'CLI must complete without transport error');
  assert.ok(typeof child.status === 'number', 'CLI must return an exit code');
  return { status: child.status as number, output: child.stdout + child.stderr };
}

function assertNoSecrets(output: string, secrets: string[] = []): void {
  assert.ok(
    !/-----BEGIN (?:RSA |ENCRYPTED )?PRIVATE KEY-----/.test(output),
    'CLI output must not contain a private PEM header'
  );
  assert.ok(!/PRIVATE_KEY\s*=/.test(output), 'CLI output must not assign private key material');
  for (const secret of secrets) {
    if (!secret) continue;
    assert.ok(!output.includes(secret), 'CLI output must not contain a supplied secret');
    assert.ok(
      !output.includes(secret.replace(/\n/g, '\\n')),
      'CLI output must not contain an escaped supplied secret'
    );
  }
}

function readKeys(cwd: string): KeyPair {
  return {
    privateKey: fs.readFileSync(path.join(cwd, 'keys/private_key.pem'), 'utf8'),
    publicKey: fs.readFileSync(path.join(cwd, 'keys/public_key.pem'), 'utf8'),
  };
}

function assertPairMatches(pair: KeyPair, passphrase?: string): void {
  let matches = false;
  try {
    const privateKey = createPrivateKey({ key: pair.privateKey, passphrase });
    const derived = createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
    const supplied = createPublicKey(pair.publicKey).export({ type: 'spki', format: 'der' });
    matches = derived.equals(supplied);
  } catch {
    // Crypto exceptions may contain input details; report only the contract.
  }
  assert.ok(matches, 'generated private key must open and match its public key');
}

function assertCannotOpen(privateKey: string, passphrase?: string): void {
  let opened = false;
  try {
    createPrivateKey({ key: privateKey, passphrase });
    opened = true;
  } catch {
    // Expected; never print key input or the exception.
  }
  assert.ok(!opened, 'encrypted private key must reject absent or incorrect passphrase');
}

test('generate-keys: PKCS#8 is genuinely encrypted, private output is silent and mode is 0600', () => {
  const fixture = temporaryDirectory();
  const passphrase = randomBytes(24).toString('base64url');
  try {
    const result = runCli('generate-keys.ts', fixture.cwd, { input: passphrase + '\n' });
    assert.equal(result.status, 0, 'generation must succeed');
    assertNoSecrets(result.output, [passphrase]);
    const pair = readKeys(fixture.cwd);
    assertNoSecrets(result.output, [pair.privateKey]);
    assert.ok(pair.privateKey.startsWith('-----BEGIN ENCRYPTED PRIVATE KEY-----'));
    assertPairMatches(pair, passphrase);
    assertCannotOpen(pair.privateKey);
    assertCannotOpen(pair.privateKey, randomBytes(24).toString('base64url'));
    assert.equal(fs.statSync(path.join(fixture.cwd, 'keys/private_key.pem')).mode & 0o777, 0o600);
  } finally {
    fixture.cleanup();
  }
});

test('generate-keys: explicit empty passphrase still creates a matching pair without printing private PEM', () => {
  const fixture = temporaryDirectory();
  try {
    const result = runCli('generate-keys.ts', fixture.cwd, { input: '\n' });
    assert.equal(result.status, 0, 'unencrypted generation must succeed when explicitly chosen');
    const pair = readKeys(fixture.cwd);
    assertNoSecrets(result.output, [pair.privateKey]);
    assertPairMatches(pair);
    assert.equal(fs.statSync(path.join(fixture.cwd, 'keys/private_key.pem')).mode & 0o777, 0o600);
  } finally {
    fixture.cleanup();
  }
});

test(
  'generate-keys: terminal prompt does not echo the passphrase (Python 3 PTY)',
  { skip: process.platform === 'win32' },
  () => {
    const fixture = temporaryDirectory();
    const passphrase = randomBytes(24).toString('base64url');
    try {
      // Python's standard-library PTY avoids adding a native Node dependency.
      // It returns only booleans/status; raw terminal output never enters TAP.
      const harness = `import json, os, pty, select, subprocess, sys, time
secret = sys.stdin.buffer.readline().rstrip(b'\\n')
master, slave = pty.openpty()
proc = None
output = bytearray()
sent = False
try:
    proc = subprocess.Popen(sys.argv[1:], stdin=slave, stdout=slave, stderr=slave, close_fds=True, start_new_session=True)
    os.close(slave)
    slave = -1
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        ready, _, _ = select.select([master], [], [], 0.1)
        if ready:
            try:
                chunk = os.read(master, 65536)
            except OSError:
                break
            if not chunk:
                break
            output.extend(chunk)
            if len(output) > 1048576:
                break
            if not sent and b'Enter passphrase' in output:
                os.write(master, secret + b'\\n')
                sent = True
        elif proc.poll() is not None:
            break
finally:
    if proc is not None:
        try:
            proc.wait(timeout=1)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
    if slave != -1:
        os.close(slave)
    os.close(master)
print(json.dumps({'status': proc.returncode, 'promptSeen': sent, 'secretVisible': secret in output, 'privateVisible': b'PRIVATE KEY-----' in output}))
`;
      const child = spawnSync(
        'python3',
        [
          '-c',
          harness,
          process.execPath,
          '--import',
          pathToFileURL(requireFromRepo.resolve('tsx')).href,
          path.join(repoRoot, 'scripts/generate-keys.ts'),
        ],
        {
          cwd: fixture.cwd,
          env: { PATH: process.env.PATH, TMPDIR: os.tmpdir(), NODE_ENV: 'test' },
          input: passphrase + '\n',
          encoding: 'utf8',
          timeout: 20_000,
          maxBuffer: 1024 * 1024,
        }
      );
      assert.ok(!child.error && child.status === 0, 'Python 3 PTY harness must complete');
      let summary:
        | { status: number; promptSeen: boolean; secretVisible: boolean; privateVisible: boolean }
        | undefined;
      try {
        summary = JSON.parse(child.stdout);
      } catch {
        // Never attach an invalid subprocess response to an assertion.
      }
      assert.ok(summary, 'PTY harness must return a sanitized summary');
      assert.equal(summary.status, 0, 'terminal generation must succeed');
      assert.equal(
        summary.promptSeen,
        true,
        'test must send the secret through the terminal prompt'
      );
      assert.equal(summary.secretVisible, false, 'terminal must not echo the supplied passphrase');
      assert.equal(summary.privateVisible, false, 'terminal must not show private PEM');
      assertPairMatches(readKeys(fixture.cwd), passphrase);
    } finally {
      fixture.cleanup();
    }
  }
);

for (const existing of ['private', 'public', 'both'] as const) {
  test(`generate-keys: refuses overwrite when ${existing} key already exists`, () => {
    const fixture = temporaryDirectory();
    const oldPrivate = randomBytes(32).toString('hex');
    const oldPublic = 'existing public key sentinel';
    try {
      const keysDir = path.join(fixture.cwd, 'keys');
      fs.mkdirSync(keysDir);
      if (existing !== 'public')
        fs.writeFileSync(path.join(keysDir, 'private_key.pem'), oldPrivate);
      if (existing !== 'private') fs.writeFileSync(path.join(keysDir, 'public_key.pem'), oldPublic);
      const result = runCli('generate-keys.ts', fixture.cwd, { input: '\n' });
      assert.ok(result.status !== 0, 'overwrite must require explicit opt-in');
      assertNoSecrets(result.output, [oldPrivate]);
      if (existing !== 'public') {
        assert.ok(
          fs.readFileSync(path.join(keysDir, 'private_key.pem'), 'utf8') === oldPrivate,
          'existing private file must stay byte-identical'
        );
      } else {
        assert.ok(!fs.existsSync(path.join(keysDir, 'private_key.pem')), 'no partial private file');
      }
      if (existing !== 'private') {
        assert.equal(fs.readFileSync(path.join(keysDir, 'public_key.pem'), 'utf8'), oldPublic);
      } else {
        assert.ok(!fs.existsSync(path.join(keysDir, 'public_key.pem')), 'no partial public file');
      }
    } finally {
      fixture.cleanup();
    }
  });
}

test('generate-keys: --force replaces an existing pair and restores private permissions to 0600', () => {
  const fixture = temporaryDirectory();
  const passphrase = randomBytes(24).toString('base64url');
  const oldPrivate = randomBytes(32).toString('hex');
  try {
    fs.mkdirSync(path.join(fixture.cwd, 'keys'));
    const privatePath = path.join(fixture.cwd, 'keys/private_key.pem');
    fs.writeFileSync(privatePath, oldPrivate, { mode: 0o644 });
    fs.chmodSync(privatePath, 0o644);
    fs.writeFileSync(path.join(fixture.cwd, 'keys/public_key.pem'), 'existing public key sentinel');
    const result = runCli('generate-keys.ts', fixture.cwd, {
      input: passphrase + '\n',
      args: ['--force'],
    });
    assert.equal(result.status, 0, 'explicit --force must permit replacement');
    const pair = readKeys(fixture.cwd);
    assertNoSecrets(result.output, [passphrase, oldPrivate, pair.privateKey]);
    assertPairMatches(pair, passphrase);
    assert.equal(fs.statSync(privatePath).mode & 0o777, 0o600);
  } finally {
    fixture.cleanup();
  }
});

function validationFixture(
  reply: RemoteReply,
  options: {
    encrypted?: boolean;
    missing?: 'META_ACCESS_TOKEN' | 'META_PHONE_NUMBER_ID';
    wrongLocal?: boolean;
    wrongPassphrase?: boolean;
  } = {}
): { result: CliResult; requestCount: number } {
  const fixture = temporaryDirectory();
  const passphrase = randomBytes(24).toString('base64url');
  const token = randomBytes(24).toString('base64url');
  const pair = ephemeralPair(options.encrypted ? passphrase : undefined);
  const publicKey = options.wrongLocal ? ephemeralPair().publicKey : pair.publicKey;
  try {
    const markerPath = path.join(fixture.cwd, 'request-count');
    const replyPath = path.join(fixture.cwd, 'reply.json');
    const remoteKey = reply === 'mismatch' ? ephemeralPair().publicKey : publicKey;
    const data =
      reply === 'absent'
        ? { success: true }
        : reply === 'blank'
          ? { business_public_key: '' }
          : reply === 'alias'
            ? { public_key: remoteKey }
            : { business_public_key: remoteKey };
    fs.writeFileSync(replyPath, JSON.stringify(data));
    const preload = path.join(fixture.cwd, 'mock-axios.cjs');
    // The preload patches the actual Axios export before loading the CLI. It also
    // blocks HTTP(S), so a failed mock cannot accidentally contact Meta.
    fs.writeFileSync(
      preload,
      `const fs = require('node:fs');
const axios = require(${JSON.stringify(requireFromRepo.resolve('axios'))});
const denyNetwork = () => { throw new Error('Real network disabled in security tests'); };
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = denyNetwork;
  transport.get = denyNetwork;
}
axios.get = async (url, config) => {
  if (url !== 'https://graph.facebook.com/v18.0/123456789/whatsapp_business_encryption' ||
      config?.headers?.Authorization !== 'Bearer ' + process.env.META_ACCESS_TOKEN) {
    throw new Error('Unexpected mock request');
  }
  fs.appendFileSync(${JSON.stringify(markerPath)}, '1');
  if (${JSON.stringify(reply)} === 'http-error') {
    const error = new Error('Synthetic HTTP failure');
    error.isAxiosError = true;
    error.response = { status: 503, data: {
      private_key: process.env.PRIVATE_KEY,
      passphrase: process.env.PASSPHRASE,
      access_token: process.env.META_ACCESS_TOKEN
    } };
    throw error;
  }
  return { status: 200, data: JSON.parse(fs.readFileSync(${JSON.stringify(replyPath)}, 'utf8')) };
};
`
    );
    const env: Record<string, string> = {
      PRIVATE_KEY: pair.privateKey.replace(/\n/g, '\\n'),
      PUBLIC_KEY: publicKey.replace(/\n/g, '\\n'),
      PASSPHRASE: options.wrongPassphrase ? randomBytes(24).toString('base64url') : passphrase,
      META_ACCESS_TOKEN: token,
      META_PHONE_NUMBER_ID: '123456789',
    };
    if (options.missing) delete env[options.missing];
    const result = runCli('validate-keys.ts', fixture.cwd, { env, preload });
    assertNoSecrets(result.output, [pair.privateKey, passphrase, env.PASSPHRASE, token]);
    const requestCount = fs.existsSync(markerPath) ? fs.readFileSync(markerPath, 'utf8').length : 0;
    return { result, requestCount };
  } finally {
    fixture.cleanup();
  }
}

for (const reply of ['absent', 'blank', 'http-error', 'mismatch'] as const) {
  test(`validate-keys: ${reply} cannot claim verified registration or exit successfully`, () => {
    const { result, requestCount } = validationFixture(reply);
    assert.equal(requestCount, 1, 'CLI must actually attempt remote verification');
    assert.ok(result.status !== 0, 'unproven registration must return nonzero');
    assert.ok(
      !/successfully registered|all validations passed|setup is correct|ready to process/i.test(
        result.output
      ),
      'unproven registration must not print a success claim'
    );
  });
}

for (const missing of ['META_ACCESS_TOKEN', 'META_PHONE_NUMBER_ID'] as const) {
  test(`validate-keys: missing ${missing} must fail closed without contacting Meta`, () => {
    const { result, requestCount } = validationFixture('match', { missing });
    assert.ok(result.status !== 0, 'missing credentials must not pass overall validation');
    assert.equal(requestCount, 0, 'missing credentials must stop before remote lookup');
  });
}

for (const reply of ['match', 'alias'] as const) {
  test(`validate-keys: matching remote ${reply} key is the positive success control`, () => {
    const { result, requestCount } = validationFixture(reply);
    assert.equal(requestCount, 1, 'success must include remote proof');
    assert.equal(result.status, 0, 'matching local and remote key must pass');
  });
}

test('validate-keys: encrypted PKCS#8 opens with PASSPHRASE and verifies the remote key', () => {
  const { result, requestCount } = validationFixture('match', { encrypted: true });
  assert.equal(requestCount, 1, 'encrypted key must reach remote verification');
  assert.equal(result.status, 0, 'encrypted PKCS#8 key must be supported');
});

test('validate-keys: wrong PKCS#8 passphrase exits nonzero before remote lookup without secret output', () => {
  const { result, requestCount } = validationFixture('match', {
    encrypted: true,
    wrongPassphrase: true,
  });
  assert.ok(result.status !== 0, 'incorrect passphrase must fail');
  assert.equal(requestCount, 0, 'incorrect passphrase must stop before remote lookup');
});

test('validate-keys: mismatched local key pair exits nonzero before remote lookup', () => {
  const { result, requestCount } = validationFixture('match', { wrongLocal: true });
  assert.ok(result.status !== 0, 'mismatched local pair must fail');
  assert.equal(requestCount, 0, 'invalid local pair must stop before remote lookup');
});
