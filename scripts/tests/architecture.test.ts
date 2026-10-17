import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { TestContext } from 'node:test';
import { inspectArchitecture } from '../verify-architecture.ts';

function inspect(t: TestContext, files: Readonly<Record<string, string>>) {
  const root = mkdtempSync(join(tmpdir(), 'apcosys-architecture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, source] of Object.entries({ 'tsconfig.app.json': '{}', ...files })) {
    const file = join(root, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, source);
  }
  return inspectArchitecture(root);
}

test('rejects a shared component importing a page, even with a type-only import', (t) => {
  const report = inspect(t, {
    'src/components/ui/Button.ts':
      "import type { Label } from '../../pages/Home'; type Also = import('../../pages/Home').Label;",
    'src/pages/Home.ts': 'export type Label = string;',
  });
  assert.equal(report.runtimeImports, 0);
  assert.match(report.failures.join('\n'), /must not import page/);
});

test('detects a runtime cycle through a dynamic import and a re-export', (t) => {
  const report = inspect(t, {
    'src/a.ts': "export const load = () => import('./b');",
    'src/b.ts': "export { load } from './a';",
  });
  assert.match(report.failures.join('\n'), /Runtime cycle/);
});

test('type-only re-exports do not create a runtime cycle', (t) => {
  const report = inspect(t, {
    'src/a.ts': "import { value } from './b'; export type Label = typeof value;",
    'src/b.ts': "export { type Label } from './a'; export const value = 'ok';",
  });
  assert.equal(report.runtimeImports, 1);
  assert.deepEqual(report.failures, []);
});

test('rejects UI dependencies in data and imports across page families', (t) => {
  const report = inspect(t, {
    'src/content/data.ts': "import '../components/ui/Button';",
    'src/components/ui/Button.ts': 'export const value = 1;',
    'src/pages/corporate/About.ts': "import '../commercial/Pricing';",
    'src/pages/commercial/Pricing.ts': 'export const price = 0;',
  });
  assert.equal(report.failures.length, 2);
});

test('allows pages to compose shared UI and data without Git staging', (t) => {
  const report = inspect(t, {
    'src/pages/corporate/About.ts':
      "import '../../components/ui/Button'; import '../../content/data';",
    'src/components/ui/Button.ts': 'export const value = 1;',
    'src/content/data.ts': 'export const data = [];',
  });
  assert.equal(report.modules, 3);
  assert.equal(report.runtimeImports, 2);
  assert.deepEqual(report.failures, []);
});

test('rejects ambiguous extensionless module names on case-insensitive filesystems', (t) => {
  const report = inspect(t, {
    'src/app/RouteReady.tsx': 'export const RouteReady = () => null;',
    'src/app/routeReady.ts': 'export const waitForRouteReady = () => true;',
  });
  assert.match(report.failures.join('\n'), /Ambiguous module names/);
});
