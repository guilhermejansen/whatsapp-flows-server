/**
 * QA owner only:
 * node --import tsx --test --test-concurrency=1 scripts/docker-init.test.ts
 *
 * Executes the real Bash entry point with isolated files and external-command
 * stubs. No Docker daemon, npm task, listener or network request is used.
 * Key examples are incomplete format markers, never real PEM key material.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';

const scriptPath = path.resolve(__dirname, 'docker-init.sh');
const emptyConfiguration = 'PRIVATE_KEY=""\nPUBLIC_KEY=""\n';
const privateMarker = 'format-only-private-file-sentinel';
const publicMarker = 'format-only-public-file-sentinel';

type KeyLayout =
  | 'absent'
  | 'empty'
  | 'private'
  | 'public'
  | 'both'
  | 'directory-symlink'
  | 'private-symlink'
  | 'not-directory';
type StubGeneration = 'refuse' | 'generate' | 'fail';
type Fixture = { cwd: string; bin: string; eventsPath: string; cleanup: () => void };
type ShellResult = { status: number; output: string; events: string[] };

function createFixture(configuration = emptyConfiguration, layout: KeyLayout = 'absent'): Fixture {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'flows-docker-init-'));
  const bin = path.join(cwd, 'test-bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(cwd, '.env'), configuration, { mode: 0o600 });
  fs.writeFileSync(path.join(cwd, '.env.docker'), emptyConfiguration, { mode: 0o600 });
  const keys = path.join(cwd, 'keys');
  if (layout === 'not-directory') {
    fs.writeFileSync(keys, 'existing regular file, not a keys directory');
  } else if (layout === 'directory-symlink') {
    const target = path.join(cwd, 'existing-key-source');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'private_key.pem'), privateMarker, { mode: 0o600 });
    fs.writeFileSync(path.join(target, 'public_key.pem'), publicMarker);
    fs.symlinkSync('existing-key-source', keys, 'dir');
  } else if (layout !== 'absent') {
    fs.mkdirSync(keys);
    if (layout === 'private-symlink') {
      fs.writeFileSync(path.join(cwd, 'existing-key-source'), privateMarker, { mode: 0o600 });
      fs.symlinkSync('../existing-key-source', path.join(keys, 'private_key.pem'));
    }
    if (layout === 'private' || layout === 'both') {
      fs.writeFileSync(path.join(keys, 'private_key.pem'), privateMarker, { mode: 0o600 });
    }
    if (layout === 'public' || layout === 'both') {
      fs.writeFileSync(path.join(keys, 'public_key.pem'), publicMarker);
    }
  }
  const eventsPath = path.join(cwd, 'external-command-events');
  // Every executable has a fixed audit vocabulary; no argv, .env or file
  // contents are serialized to logs, including on unexpected invocation.
  const stub = `#!/bin/bash
set -eu
event() { printf '%s\\n' "$1" >> "$TEST_EVENTS"; }
case "\${0##*/}" in
  docker) event docker; exit 91 ;;
  docker-compose)
    case "\${1:-}" in
      build) event compose-build ;;
      up) event compose-up ;;
      ps)
        event compose-ps
        printf '%s\\n' 'whatsapp_flow_db healthy' 'whatsapp_flow_app Up'
        ;;
      exec) event compose-exec ;;
      logs) event compose-logs ;;
      *) event unexpected-compose; exit 91 ;;
    esac
    ;;
  npm)
    if [[ "$#" != 2 || "$1" != run || "$2" != generate-keys ]]; then
      event unexpected-npm
      exit 91
    fi
    event npm-generate
    case "$TEST_GENERATION" in
      refuse) exit 77 ;;
      fail) exit 79 ;;
      generate)
        if [[ -e keys/private_key.pem || -L keys/private_key.pem || -e keys/public_key.pem || -L keys/public_key.pem ]]; then
          event forbidden-overwrite-attempt
          exit 77
        fi
        mkdir -p keys
        printf '%s' '${privateMarker}' > keys/private_key.pem
        printf '%s' '${publicMarker}' > keys/public_key.pem
        ;;
    esac
    ;;
  curl) event curl-stub ;;
  sleep) event sleep-stub ;;
  nano) event editor-stub; exit 91 ;;
  *) event unexpected-command; exit 91 ;;
esac
`;
  for (const command of ['docker', 'docker-compose', 'npm', 'curl', 'sleep', 'nano']) {
    fs.writeFileSync(path.join(bin, command), stub, { mode: 0o700 });
  }
  return { cwd, bin, eventsPath, cleanup: () => fs.rmSync(cwd, { recursive: true, force: true }) };
}

function snapshotConfiguration(fixture: Fixture): string {
  const entries: unknown[] = [];
  function visit(relative: string): void {
    const filename = path.join(fixture.cwd, relative);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(filename);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      entries.push([relative, 'symlink', fs.readlinkSync(filename)]);
    } else if (stat.isDirectory()) {
      entries.push([relative, 'directory', stat.mode & 0o777]);
      for (const child of fs.readdirSync(filename).sort()) visit(path.join(relative, child));
    } else {
      entries.push([
        relative,
        'file',
        stat.mode & 0o777,
        createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),
      ]);
    }
  }
  // Include symlink destinations that were created by this fixture, but never
  // follow arbitrary links or inspect any operator configuration.
  for (const relative of [
    '.env',
    '.env.docker',
    '.env.docker.example',
    'keys',
    'existing-key-source',
  ])
    visit(relative);
  return JSON.stringify(entries);
}

function runShell(
  fixture: Fixture,
  options: { input?: string; generation?: StubGeneration; sourceOnly?: boolean } = {}
): ShellResult {
  const args = ['--noprofile', '--norc'];
  if (options.sourceOnly) {
    args.push(
      '-c',
      'source "$1"; printf "source-returned\\n" >> "$TEST_EVENTS"',
      'source-test',
      scriptPath
    );
  } else {
    args.push(scriptPath);
  }
  const child = spawnSync('/bin/bash', args, {
    cwd: fixture.cwd,
    // No inherited BASH_ENV, exported functions, secrets, proxies or shell init.
    // Stubs precede only system tools; real Docker/npm cannot be selected.
    env: {
      PATH: fixture.bin + ':/usr/bin:/bin',
      TMPDIR: os.tmpdir(),
      LC_ALL: 'C',
      EDITOR: 'nano',
      TEST_EVENTS: fixture.eventsPath,
      TEST_GENERATION: options.generation ?? 'refuse',
    },
    input: options.input ?? 'nny',
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  });
  // Never attach process output or arbitrary subprocess errors to TAP failures.
  assert.ok(!child.error && child.signal === null, 'isolated Bash command must complete');
  assert.ok(typeof child.status === 'number', 'Bash must return an exit code');
  const output = child.stdout + child.stderr;
  assert.ok(
    !/-----BEGIN (?:RSA |ENCRYPTED )?PRIVATE KEY-----/.test(output),
    'bootstrap must not print private key headers'
  );
  assert.ok(!output.includes(privateMarker), 'bootstrap must not print private file contents');
  const events = fs.existsSync(fixture.eventsPath)
    ? fs.readFileSync(fixture.eventsPath, 'utf8').trim().split('\n')
    : [];
  return { status: child.status as number, output, events };
}

function assertNoServiceStart(result: ShellResult): void {
  assert.ok(
    !result.events.some(
      (event) => event.startsWith('compose-') || event === 'docker' || event === 'curl-stub'
    ),
    'pending configuration must stop before build/start/migrations/verification'
  );
  assert.ok(
    !/setup complete|services are running and ready/i.test(result.output),
    'pending configuration must not claim completion'
  );
}

function assertPending(result: ShellResult): void {
  assert.equal(
    result.status,
    2,
    'pending configuration must return the documented controlled status 2'
  );
  assertNoServiceStart(result);
  assert.ok(/\.env/.test(result.output), 'pending setup must explain where to configure keys');
  assert.ok(
    /import|configur|existing|preserv/i.test(result.output),
    'pending setup must give safe import/configuration guidance'
  );
}

test('docker-init: source defines functions without running setup or external commands', () => {
  const fixture = createFixture();
  try {
    const before = snapshotConfiguration(fixture);
    const result = runShell(fixture, { sourceOnly: true });
    assert.equal(result.status, 0, 'sourcing must return normally');
    assert.ok(
      result.events.length === 1 && result.events[0] === 'source-returned',
      'sourcing must not invoke main'
    );
    assert.ok(
      snapshotConfiguration(fixture) === before,
      'sourcing must preserve all configuration'
    );
  } finally {
    fixture.cleanup();
  }
});

for (const format of [
  { name: 'PKCS1', header: 'RSA PRIVATE KEY' },
  { name: 'PKCS8', header: 'PRIVATE KEY' },
  { name: 'encrypted-PKCS8', header: 'ENCRYPTED PRIVATE KEY' },
]) {
  for (const layout of ['absent', 'both'] as const) {
    test(`docker-init: configured ${format.name} with ${layout} key files is preserved without generation`, () => {
      // Incomplete format marker only: this test targets config recognition,
      // not RSA validity (covered by the separate real generator CLI tests).
      const configuration = `PRIVATE_KEY="-----BEGIN ${format.header}-----\\nFORMAT-ONLY-NOT-A-KEY"\nPUBLIC_KEY="public-format-marker"\n`;
      const fixture = createFixture(configuration, layout);
      try {
        const before = snapshotConfiguration(fixture);
        const result = runShell(fixture);
        assert.equal(result.status, 0, 'configured keys must allow normal bootstrap');
        assert.ok(
          !result.events.includes('npm-generate'),
          'configured keys must not trigger generation'
        );
        assert.ok(
          snapshotConfiguration(fixture) === before,
          'configured keys and .env must remain byte-identical'
        );
        assert.equal(
          result.events.filter((event) => event === 'compose-build').length,
          1,
          'normal bootstrap must reach real start_services through its Docker stub'
        );
        assert.equal(
          result.events.filter((event) => event === 'compose-up').length,
          1,
          'normal bootstrap must start services exactly once'
        );
      } finally {
        fixture.cleanup();
      }
    });
  }
}

test('docker-init: exported PKCS8 PRIVATE_KEY is preserved as configured', () => {
  const configuration =
    'export PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nFORMAT-ONLY-NOT-A-KEY"\nPUBLIC_KEY="public-format-marker"\n';
  const fixture = createFixture(configuration, 'both');
  try {
    const before = snapshotConfiguration(fixture);
    const result = runShell(fixture);
    assert.equal(result.status, 0, 'dotenv-compatible export assignment must be recognized');
    assert.ok(
      !result.events.includes('npm-generate'),
      'exported key configuration must not generate or rotate keys'
    );
    assert.ok(
      snapshotConfiguration(fixture) === before,
      'exported configuration and existing keys must remain unchanged'
    );
    assert.equal(
      result.events.filter((event) => event === 'compose-up').length,
      1,
      'configured export assignment must allow normal service startup'
    );
  } finally {
    fixture.cleanup();
  }
});

for (const layout of [
  'private',
  'public',
  'both',
  'directory-symlink',
  'private-symlink',
  'not-directory',
] as const) {
  test(`docker-init: ${layout} existing keys without config stop safely without rotation or services`, () => {
    const fixture = createFixture(emptyConfiguration, layout);
    try {
      const before = snapshotConfiguration(fixture);
      const result = runShell(fixture, { input: 'nny', generation: 'refuse' });
      assertPending(result);
      assert.ok(
        !result.events.includes('npm-generate'),
        'existing key paths must never invoke the generator'
      );
      assert.ok(
        snapshotConfiguration(fixture) === before,
        'existing files, symlinks, permissions and .env must be preserved'
      );
    } finally {
      fixture.cleanup();
    }
  });
}

for (const marker of [
  { name: 'comment-only', line: '# PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----"' },
  { name: 'wrong-variable', line: 'UNRELATED="-----BEGIN RSA PRIVATE KEY-----"' },
]) {
  test(`docker-init: ${marker.name} header must not count as configured PRIVATE_KEY`, () => {
    const fixture = createFixture(marker.line + '\n' + emptyConfiguration, 'both');
    try {
      const before = snapshotConfiguration(fixture);
      const result = runShell(fixture);
      assertPending(result);
      assert.ok(
        !result.events.includes('npm-generate'),
        'existing keys must not be rotated after a misleading marker'
      );
      assert.ok(
        snapshotConfiguration(fixture) === before,
        'misleading markers must not cause configuration writes'
      );
    } finally {
      fixture.cleanup();
    }
  });
}

for (const layout of ['absent', 'empty'] as const) {
  for (const reply of ['n', ''] as const) {
    test(`docker-init: ${layout} keys and ${reply ? 'decline' : 'EOF'} pause configuration without services`, () => {
      const fixture = createFixture(emptyConfiguration, layout);
      try {
        const before = snapshotConfiguration(fixture);
        // First two single-character replies preserve .env and decline editing.
        const result = runShell(fixture, { input: 'nn' + reply });
        assertPending(result);
        assert.ok(!result.events.includes('npm-generate'), 'decline or EOF must not generate');
        assert.ok(
          snapshotConfiguration(fixture) === before,
          'decline or EOF must not write configuration'
        );
      } finally {
        fixture.cleanup();
      }
    });
  }

  test(`docker-init: ${layout} keys may generate once, then pause for explicit configuration`, () => {
    const fixture = createFixture(emptyConfiguration, layout);
    try {
      const envBefore = fs.readFileSync(path.join(fixture.cwd, '.env'));
      const result = runShell(fixture, { input: 'nny', generation: 'generate' });
      assertPending(result);
      assert.equal(
        result.events.filter((event) => event === 'npm-generate').length,
        1,
        'empty key storage may generate once'
      );
      assert.ok(
        fs.readFileSync(path.join(fixture.cwd, '.env')).equals(envBefore),
        'generation must not automatically import private contents into .env'
      );
      assert.ok(
        fs.readFileSync(path.join(fixture.cwd, 'keys/private_key.pem'), 'utf8') === privateMarker,
        'stub-generated private file must be preserved'
      );
      assert.ok(
        fs.readFileSync(path.join(fixture.cwd, 'keys/public_key.pem'), 'utf8') === publicMarker,
        'stub-generated public file must be preserved'
      );
    } finally {
      fixture.cleanup();
    }
  });
}

test('docker-init: generator error is handled as failure 1 without starting services', () => {
  const fixture = createFixture();
  try {
    const before = snapshotConfiguration(fixture);
    const result = runShell(fixture, { input: 'nny', generation: 'fail' });
    assert.equal(
      result.status,
      1,
      'real generation failure must return 1, not leak the subprocess status through set -e'
    );
    assert.equal(
      result.events.filter((event) => event === 'npm-generate').length,
      1,
      'generator must actually be attempted'
    );
    assertNoServiceStart(result);
    assert.ok(
      snapshotConfiguration(fixture) === before,
      'failed generator must not mutate configuration'
    );
  } finally {
    fixture.cleanup();
  }
});

for (const reply of ['n', ''] as const) {
  test(`docker-init: new .env uses the distributed example and ${reply ? 'decline' : 'EOF'} leaves setup pending`, () => {
    const fixture = createFixture();
    try {
      fs.rmSync(path.join(fixture.cwd, '.env'));
      fs.rmSync(path.join(fixture.cwd, '.env.docker'));
      // Copy the actual distributed template, not a reconstructed test version.
      // It contains public examples only; no operator .env is ever read.
      const templatePath = path.resolve(__dirname, '..', '.env.docker.example');
      const template = fs.readFileSync(templatePath);
      fs.copyFileSync(templatePath, path.join(fixture.cwd, '.env.docker.example'));
      // There is no overwrite prompt on first use. Decline editing, then either
      // decline generation or send EOF at the generation question.
      const result = runShell(fixture, { input: 'n' + reply });
      assertPending(result);
      assert.ok(
        !result.events.includes('npm-generate'),
        'unedited example configuration must not generate keys without opt-in'
      );
      assert.ok(
        fs.existsSync(path.join(fixture.cwd, '.env')),
        'first setup must create .env from the distributed template'
      );
      assert.ok(
        fs.readFileSync(path.join(fixture.cwd, '.env')).equals(template),
        'created .env must match the distributed example without automatic secret edits'
      );
      assert.ok(
        fs.readFileSync(path.join(fixture.cwd, '.env.docker.example')).equals(template),
        'bootstrap must preserve the distributed template'
      );
      assert.ok(
        !fs.existsSync(path.join(fixture.cwd, 'keys')),
        'decline or EOF must not create key files'
      );
    } finally {
      fixture.cleanup();
    }
  });
}
