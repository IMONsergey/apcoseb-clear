import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { renderThemeBootstrap } from '../theme-bootstrap.ts';

const script = renderThemeBootstrap();
const cases = [
  ['light', false, 'light', 'light'],
  ['light', true, 'light', 'light'],
  ['dark', false, 'dark', 'dark'],
  ['dark', true, 'dark', 'dark'],
  ['system', false, 'system', 'light'],
  ['system', true, 'system', 'dark'],
  ['invalid', false, 'system', 'light'],
  ['invalid', true, 'system', 'dark'],
  [null, false, 'system', 'light'],
  [null, true, 'system', 'dark'],
] as const;
for (const [stored, systemDark, mode, theme] of cases) {
  test(`initial theme: stored=${stored}, systemDark=${systemDark}`, () => {
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
    const meta = { content: '' };
    runInNewContext(script, {
      localStorage: { getItem: () => stored },
      window: { matchMedia: () => ({ matches: systemDark }) },
      document: { documentElement: root, querySelector: () => meta },
    });
    assert.equal(root.dataset.themeMode, mode);
    assert.equal(root.dataset.theme, theme);
    assert.equal(root.style.colorScheme, theme);
    assert.equal(meta.content, theme === 'dark' ? '#0D1113' : '#03879F');
  });
}

test('restricted storage and a missing meta tag do not prevent initial theme selection', () => {
  const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
  runInNewContext(script, {
    localStorage: {
      getItem: () => {
        throw new Error('Storage is restricted');
      },
    },
    window: { matchMedia: () => ({ matches: true }) },
    document: { documentElement: root, querySelector: () => null },
  });
  assert.equal(root.dataset.themeMode, 'system');
  assert.equal(root.dataset.theme, 'dark');
});
