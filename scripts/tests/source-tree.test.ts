import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { TestContext } from 'node:test';
import { inspectSourceTree } from '../verify-source-tree.ts';

function fixture(t: TestContext, files: readonly string[]) {
  const root = mkdtempSync(join(tmpdir(), 'apcosys-source-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of files) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '');
  }
  return inspectSourceTree(root);
}

test('accepts ordinary source and ignores local build output', (t) => {
  const report = fixture(t, ['src/app/router.ts', 'docs/README.md', 'node_modules/stuff.js']);
  assert.deepEqual(report.failures, []);
  assert.equal(report.files, 2);
});

test('detects unsupported Windows filenames and stray artifacts', (t) => {
  const report = fixture(t, ['src/CON.ts', 'src/old.rej', 'docs/archive/REPORT.md']);
  assert.match(report.failures.join('\n'), /Non-portable filename/);
  assert.match(report.failures.join('\n'), /Transient file/);
  assert.match(report.failures.join('\n'), /Archived review material/);
});
