import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { TestContext } from 'node:test';
import { inspectSourceTree } from '../verify-source-tree.ts';

function fixture(t: TestContext, files: readonly string[], contents = '') {
  const root = mkdtempSync(join(tmpdir(), 'apcosys-source-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of files) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  }
  return inspectSourceTree(root);
}

test('accepts ordinary source and ignores local build output', (t) => {
  const report = fixture(t, ['src/app/router.ts', 'docs/README.md', 'node_modules/stuff.js']);
  assert.deepEqual(report.failures, []);
  assert.equal(report.files, 2);
});

test('rejects authored JavaScript while excluding dependencies and compiled output', (t) => {
  const report = fixture(t, [
    'src/legacy.js',
    'src/widget.jsx',
    'scripts/legacy.mjs',
    'old.config.cjs',
    'node_modules/dependency/index.js',
    'dist/assets/index.js',
  ]);
  assert.equal(report.failures.length, 4);
  assert.ok(report.failures.every((failure) => failure.includes('must use TypeScript')));
});

test('rejects executable inline HTML scripts and event handlers', (t) => {
  const report = fixture(
    t,
    ['index.html'],
    '<script>window.start()</script><button onclick="run()">Go</button>',
  );
  assert.equal(report.failures.length, 2);
});

test('accepts TypeScript entrypoints and JSON metadata in HTML', (t) => {
  const report = fixture(
    t,
    ['index.html'],
    '<script type="module" src="/src/main.tsx"></script><script type="application/ld+json">{"name":"Apcosys"}</script>',
  );
  assert.deepEqual(report.failures, []);
});

test('detects unsupported Windows filenames and stray artifacts', (t) => {
  const report = fixture(t, ['src/CON.ts', 'src/old.rej', 'docs/archive/REPORT.md']);
  assert.match(report.failures.join('\n'), /Non-portable filename/);
  assert.match(report.failures.join('\n'), /Transient file/);
  assert.match(report.failures.join('\n'), /Archived review material/);
});
