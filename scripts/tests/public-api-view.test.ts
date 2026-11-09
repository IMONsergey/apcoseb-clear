import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptPublicApiDocument } from '../../src/lib/public-api-document.ts';
import { compilePublicApiDocument } from '../../src/lib/public-api-compile.ts';
import {
  hydratePublicApiDocument,
  type CompiledPublicApiDocument,
} from '../../src/lib/public-api-view.ts';

const snapshot = readFileSync(
  new URL('../../public/api/client.openapi.json', import.meta.url),
  'utf8',
);
const fixture = () => adaptPublicApiDocument(JSON.parse(snapshot) as unknown);

test('compiled documentation preserves every displayed root value and one endpoint list', () => {
  const full = fixture();
  const compiled = compilePublicApiDocument(full);
  const values = compiled as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(full)) {
    if (!['endpoints', 'byId', 'title', 'description', 'source', 'credits'].includes(key))
      assert.deepEqual(values[key], value, key);
  }
  assert.deepEqual(compiled.source, { name: full.source.name });
  assert.deepEqual(
    compiled.credits,
    Object.fromEntries(
      Object.entries(full.credits).filter(([key]) => key !== 'defaultAnalyticsWeight'),
    ),
  );
  assert.equal(Object.hasOwn(compiled, 'title'), false);
  assert.equal(Object.hasOwn(compiled, 'description'), false);
  assert.equal(Object.hasOwn(compiled, 'byId'), false);
  assert.equal(Object.hasOwn(compiled, 'components'), false);
  assert.deepEqual(
    compiled.endpoints.map((operation) => operation.operationId),
    full.endpoints.map((operation) => operation.operationId),
  );
});

test('every displayed operation value is identical to the fully validated adapter output', () => {
  const full = fixture();
  const view = hydratePublicApiDocument(compilePublicApiDocument(full));
  for (const operation of full.endpoints) {
    const projected = view.byId[operation.operationId];
    for (const key of [
      'operationId',
      'sectionId',
      'method',
      'path',
      'description',
      'plans',
      'creditWeight',
      'requestExample',
    ] as const)
      assert.deepEqual(projected[key], operation[key], operation.operationId + '.' + key);
    if (['search-hosts', 'search-buckets'].includes(operation.operationId))
      assert.deepEqual(projected.requestFields, operation.requestFields);
    else assert.deepEqual(projected.requestFields, []);
    if (['search-hosts', 'get-host', 'search-buckets'].includes(operation.operationId))
      assert.deepEqual(projected.responseFields, operation.responseFields);
    else assert.deepEqual(projected.responseFields, []);
    if (['search-hosts', 'host-analytics'].includes(operation.operationId))
      assert.equal(projected.responseExample, operation.responseExample);
    else assert.equal(projected.responseExample, '');
  }
});

test('serialized compiler output hydrates synchronously with stable operation identities', () => {
  const compiled = compilePublicApiDocument(fixture());
  const restored = JSON.parse(JSON.stringify(compiled)) as CompiledPublicApiDocument;
  const view = hydratePublicApiDocument(restored);
  assert.deepEqual(view, hydratePublicApiDocument(compiled));
  for (const operation of view.endpoints) assert.equal(view.byId[operation.operationId], operation);
});

test('compilation does not mutate the full model or remove source contract data', () => {
  const full = fixture();
  const before = JSON.stringify(full);
  const compiled = compilePublicApiDocument(full);
  assert.equal(JSON.stringify(full), before);
  assert.ok(full.byId['private-hosts'].requestFields.length > 0);
  assert.ok(full.byId['get-host'].responseExample.length > 0);
  assert.deepEqual(
    compiled.endpoints.find((operation) => operation.operationId === 'private-hosts')!
      .requestFields,
    [],
  );
  assert.equal(
    compiled.endpoints.find((operation) => operation.operationId === 'get-host')!.responseExample,
    '',
  );
});
