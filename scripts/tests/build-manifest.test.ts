import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { staticAssets } from '../lib/build-manifest';

test('page assets include shared dependencies once and leave optional scenes unloaded', () => {
  const manifest = {
    page: {
      file: 'page.js',
      imports: ['shared', 'shared'],
      css: ['page.css'],
      dynamicImports: ['scene'],
    },
    shared: { file: 'shared.js', imports: ['page'], css: ['base.css'] },
    scene: { file: 'scene.js', css: ['scene.css'] },
    other: { file: 'other-page.js' },
  };
  assert.deepEqual([...staticAssets(manifest, ['page'])].sort(), [
    'base.css',
    'page.css',
    'page.js',
    'shared.js',
  ]);
});

test('a missing route dependency stops the build instead of emitting a broken hint', () => {
  assert.throws(
    () => staticAssets({ page: { file: 'page.js', imports: ['missing'] } }, ['page']),
    /Missing build manifest entry: missing/,
  );
});
