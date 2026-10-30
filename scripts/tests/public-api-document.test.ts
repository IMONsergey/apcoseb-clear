import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  adaptPublicApiDocument,
  publicApiOperationIds,
  publicApiSpecUrl,
} from '../../src/lib/public-api-document.ts';
import { readPublicSettings } from '../../src/config/public-settings.ts';

type RecordValue = Record<string, unknown>;
const record = (value: unknown) => value as RecordValue;
const snapshot = readFileSync(
  new URL('../../public/api/client.openapi.json', import.meta.url),
  'utf8',
);
const fixture = () => JSON.parse(snapshot) as RecordValue;
const schemas = (document: RecordValue) => record(record(document.components).schemas);
function operation(document: RecordValue, id: string): RecordValue {
  for (const path of Object.values(record(document.paths)))
    for (const candidate of Object.values(record(path)))
      if (candidate && typeof candidate === 'object' && record(candidate).operationId === id)
        return record(candidate);
  throw new Error('Missing test operation ' + id);
}
function properties(document: RecordValue, schema: string): RecordValue {
  return record(record(schemas(document)[schema]).properties);
}
function projectionDag(
  document: RecordValue,
  kind: 'allOf' | 'anyOf' | 'oneOf',
  levels: number,
  prefix: string,
  leaf: RecordValue,
  width = 2,
): RecordValue {
  const definitions = schemas(document);
  definitions[prefix + '0'] = leaf;
  for (let level = 1; level <= levels; level++) {
    definitions[prefix + level] = {
      [kind]: Array.from({ length: width }, () => ({
        $ref: '#/components/schemas/' + prefix + (level - 1),
      })),
    };
  }
  return { $ref: '#/components/schemas/' + prefix + levels };
}

test('canonical OpenAPI supplies eight ordered methods and the existing section aliases', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.equal(document.openapi, '3.1.1');
  assert.equal(document.serverUrl, 'https://api.apcosys.net');
  assert.deepEqual(
    document.endpoints.map((item) => item.operationId),
    publicApiOperationIds,
  );
  assert.equal(document.byId['get-host'].sectionId, 'host-details');
  assert.equal(document.byId['host-analytics'].sectionId, 'analytics');
  assert.equal(document.byId['get-private-host'].sectionId, 'private-search');
  assert.equal(document.byId['get-host'].path, '/api/v1/search/hosts/{host}');
  assert.equal(
    document.filterCatalogue.reduce((sum, group) => sum + group.fields.length, 0),
    67,
  );
  assert.equal(
    document.errors.reduce((sum, group) => sum + group.rows.length, 0),
    35,
  );
});

test('replacing a standard schema description/default changes the projected reference', () => {
  const source = fixture();
  record(source.info).version = 'local-test-replacement';
  record(properties(source, 'SearchRequest').page).description = 'Replacement paging description.';
  record(properties(source, 'SearchRequest').page).default = 7;
  const document = adaptPublicApiDocument(source);
  assert.equal(document.version, 'local-test-replacement');
  const page = document.byId['search-hosts'].requestFields.find((field) => field.name === 'page');
  assert.ok(page?.description.includes('Replacement paging description.'));
  assert.equal(page?.defaultValue, '7');
});

test('private allOf overrides are projected without losing base fields', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.equal(document.byId['private-hosts'].requestFields.length, 17);
  assert.match(
    document.privateFields.find((field) => field.name === 'user_name')!.description,
    /replaced/,
  );
  assert.match(
    document.privateFields.find((field) => field.name === 'task_ids')!.description,
    /caller's private/,
  );
  assert.ok(document.byId['private-hosts'].plans.includes('Free'));
});

test('recursive anyOf preserves leaf/group alternatives without inventing universal requirements', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.deepEqual(
    document.filterFields.map((field) => field.name),
    ['field', 'value', 'operator', 'filters'],
  );
  assert.ok(document.filterFields.every((field) => !field.required));
  assert.equal(document.filterFields.find((field) => field.name === 'filters')!.type, 'object[]');
  assert.match(
    document.filterFields.find((field) => field.name === 'value')!.description,
    /conflicts/,
  );
  assert.match(document.headerNote, /conflict/);
  assert.match(document.filterExample, /"operator": "OR"/);
});

test('OpenAPI 3.1 type unions and conditional facet refinements stay accurate', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.equal(
    document.rangeFields.find((field) => field.name === 'start')!.type,
    'number | string',
  );
  assert.equal(
    document.analyticsFields.find((field) => field.name.endsWith('.key'))!.type,
    'string | number',
  );
  assert.match(
    document.analyticsFields.find((field) => field.name.endsWith('.key'))!.description,
    /always use a string/,
  );
  assert.ok(document.rangeFields.find((field) => field.name === 'field')!.required);
  assert.ok(!document.rangeFields.find((field) => field.name === 'start')!.required);
});

test('optional response members remain optional and nested service fields follow the schema', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.ok(document.byId['get-host'].responseFields.every((field) => !field.required));
  assert.ok(document.tlsFields.some((field) => field.name === 'sha256'));
  assert.ok(!document.tlsFields.some((field) => field.name === 'certificate_info'));
  assert.ok(document.robotsTxtFields.some((field) => field.name === 'body'));
  assert.ok(!document.privatePortFields.some((field) => field.name === 'tls_info'));
  assert.ok(document.byId['search-hosts'].requestFields.some((field) => field.name === 'cve_ID'));
});

test('documented HTTP errors retain public 500 absence and private 404 absence', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.match(document.byId['get-host'].description, /absence is HTTP 500/);
  assert.match(document.byId['get-private-host'].description, /404 host not found/);
  assert.match(document.errorExample, /"retry_after": 1/);
  assert.equal(document.rate.tokensPerSecond, 100);
  assert.equal(document.rate.burst, 10);
  assert.equal(document.credits.reuseSeconds, 600);
});

test('latest index metadata exposes types, aliases, multiple catalogues and whole-query choice', () => {
  const document = adaptPublicApiDocument(fixture());
  const fields = new Map(
    document.indexSelectionFields.map((field) => [field.name, field.description]),
  );
  assert.equal(fields.get('types'), '["ipv4","ipv6","domain"]');
  assert.equal(fields.get('type_aliases'), '{"domains":"domain"}');
  assert.equal(fields.get('without_type_filter'), 'all three catalogues');
  assert.equal(
    fields.get('multiple_type_filters'),
    'Several type leaves search several catalogues.',
  );
  assert.equal(fields.get('query_moves_as_a_whole'), 'true');
});

test('examples resolve local refs and generate correct base-plus-full-path cURL', () => {
  const document = adaptPublicApiDocument(fixture());
  assert.match(
    document.byId['search-hosts'].requestExample,
    /https:\/\/api\.apcosys\.net\/api\/v1\/search\/hosts/,
  );
  assert.ok(!document.byId['search-hosts'].requestExample.includes('/api/v1/api/v1/'));
  assert.ok(document.byId['search-hosts'].requestExample.includes('X-API-Key: $APCOSYS_API_KEY'));
  assert.ok(!document.byId['get-host'].requestExample.includes(' -d '));
  assert.match(document.byId['get-host'].requestExample, /203\.0\.113\.10/);
  assert.ok(Array.isArray(JSON.parse(document.byId['search-hosts'].responseExample).hosts));
});

test('cURL is generated from data with shell quoting, not executable extension text', () => {
  const source = fixture();
  operation(source, 'search-hosts')['x-apcosys-curl-example'] = 'do-not-copy-this-command';
  const examples = record(record(source.components).examples);
  record(record(examples.HostSearchRequest).value).full_text_search = "O'Reilly $(not-executed)";
  const code = adaptPublicApiDocument(source).byId['search-hosts'].requestExample;
  assert.ok(!code.includes('do-not-copy-this-command'));
  assert.ok(code.includes("O'\\''Reilly $(not-executed)"));
});

test('adapting a document does not mutate its source', () => {
  const source = fixture();
  const before = JSON.stringify(source);
  adaptPublicApiDocument(source);
  assert.equal(JSON.stringify(source), before);
});

for (const version of ['3.0.3', '3.1.0', '3.2.0', undefined]) {
  test('unsupported OpenAPI version fails closed: ' + String(version), () => {
    const source = fixture();
    source.openapi = version;
    assert.throws(() => adaptPublicApiDocument(source), /version/);
  });
}

test('missing, duplicate or unknown operation ids cannot silently remove reference sections', () => {
  const missing = fixture();
  delete record(missing.paths)['/api/v1/search/buckets'];
  assert.throws(() => adaptPublicApiDocument(missing), /eight/);
  const duplicate = fixture();
  operation(duplicate, 'private-hosts').operationId = 'search-hosts';
  operation(duplicate, 'search-hosts');
  const privateOperation = record(record(duplicate.paths)['/api/v1/search/private/hosts']).post;
  record(privateOperation)['x-apcosys-doc-id'] = 'search-hosts';
  assert.throws(() => adaptPublicApiDocument(duplicate), /Duplicate/);
  const unknown = fixture();
  operation(unknown, 'private-hosts').operationId = 'unknown-operation';
  assert.throws(() => adaptPublicApiDocument(unknown), /operation id/);
});

test('external and unresolved refs are rejected without being fetched', () => {
  for (const ref of [
    'https://example.test/schema.json',
    '#/components/schemas/Absent',
    '#/components/schemas/toString',
  ]) {
    const source = fixture();
    properties(source, 'SearchRequest').page = { $ref: ref };
    assert.throws(() => adaptPublicApiDocument(source), /reference/);
  }
});

test('direct reference cycles and allOf composition cycles are bounded; normal recursion is supported', () => {
  const direct = fixture();
  schemas(direct).Loop = { $ref: '#/components/schemas/Loop' };
  assert.throws(() => adaptPublicApiDocument(direct), /Cyclic/);
  const composed = fixture();
  schemas(composed).SearchRequest = { allOf: [{ $ref: '#/components/schemas/SearchRequest' }] };
  assert.throws(() => adaptPublicApiDocument(composed), /composition/);
  assert.doesNotThrow(() => adaptPublicApiDocument(fixture()));
});

test('exactly one root API server is required instead of silently choosing the first', () => {
  for (const servers of [
    [],
    [{ url: 'https://api.apcosys.net' }, { url: 'https://other.example.test' }],
    [{ url: 'https://api.apcosys.net' }, { url: 'https://api.apcosys.net' }],
  ]) {
    const source = fixture();
    source.servers = servers;
    assert.throws(() => adaptPublicApiDocument(source), /Exactly one root API server/);
  }
});

for (const level of ['path', 'operation'] as const) {
  test(level + ' API server overrides are rejected rather than ignored', () => {
    for (const servers of [
      [],
      null,
      [{ url: 'https://other.example.test' }],
      [{ url: 'https://api.apcosys.net/alternate-base' }],
      [{ url: 'https://api.apcosys.net' }],
    ]) {
      const source = fixture();
      const target =
        level === 'path'
          ? record(record(source.paths)['/api/v1/search/hosts'])
          : operation(source, 'search-hosts');
      target.servers = servers;
      assert.throws(() => adaptPublicApiDocument(source), /API server overrides/);
    }
  });
}

for (const kind of ['allOf', 'anyOf', 'oneOf'] as const) {
  test(kind + ' shared acyclic schema DAG is bounded by one per-parse projection budget', () => {
    const source = fixture();
    const original = schemas(source).SearchRequest;
    const extra = projectionDag(source, kind, 14, 'GuardDag', {
      type: 'object',
      properties: { budget_probe: { type: 'string' } },
    });
    schemas(source).SearchRequest = { allOf: [original, extra] };
    assert.ok(Buffer.byteLength(JSON.stringify(source), 'utf8') < 512 * 1024);
    assert.throws(() => adaptPublicApiDocument(source), /schema projection work limit/);
    // A failed document must not consume the next document's budget.
    assert.doesNotThrow(() => adaptPublicApiDocument(fixture()));
  });
}

test('type-label projection shares the work budget instead of expanding a small union DAG', () => {
  const source = fixture();
  properties(source, 'SearchRequest').budget_probe = projectionDag(
    source,
    'anyOf',
    10,
    'TypeDag',
    { type: 'string' },
    3,
  );
  assert.throws(() => adaptPublicApiDocument(source), /schema projection work limit/);
});

test('the existing raw node and depth guards remain independent of projection work', () => {
  const wide = fixture();
  wide['x-test-metadata'] = Array.from({ length: 50001 }, () => 0);
  assert.throws(() => adaptPublicApiDocument(wide), /OpenAPI document complexity/);
  const deep = fixture();
  let nested: RecordValue = {};
  for (let depth = 0; depth < 65; depth++) nested = { next: nested };
  deep['x-test-metadata'] = nested;
  assert.throws(() => adaptPublicApiDocument(deep), /OpenAPI document complexity/);
});

test('root and operation security must require the documented API-key header', () => {
  const noAuth = fixture();
  noAuth.security = [];
  assert.throws(() => adaptPublicApiDocument(noAuth), /authentication/);
  const operationOverride = fixture();
  operation(operationOverride, 'search-hosts').security = [];
  assert.throws(() => adaptPublicApiDocument(operationOverride), /authentication/);
  const anonymousAlternative = fixture();
  anonymousAlternative.security = [{ ApiKeyAuth: [] }, {}];
  assert.throws(() => adaptPublicApiDocument(anonymousAlternative), /authentication/);
  for (const change of [
    { in: 'query' },
    { name: 'Other-Key' },
    { type: 'http', scheme: 'bearer' },
  ]) {
    const source = fixture();
    Object.assign(record(record(record(source.components).securitySchemes).ApiKeyAuth), change);
    assert.throws(() => adaptPublicApiDocument(source), /authentication/);
  }
});

test('conflicting method allow-lists, invalid credit weights and unsafe server/path values are rejected', () => {
  const conflict = fixture();
  operation(conflict, 'search-hosts')['x-apcosys-plans'] = ['Business'];
  assert.throws(() => adaptPublicApiDocument(conflict), /allow-list/);
  const weight = fixture();
  operation(weight, 'search-hosts')['x-apcosys-credit-weight'] = -1;
  assert.throws(() => adaptPublicApiDocument(weight), /nonnegative/);
  const server = fixture();
  server.servers = [{ url: 'http://api.apcosys.net' }];
  assert.throws(() => adaptPublicApiDocument(server), /HTTPS/);
  const unsafePath = fixture();
  const paths = record(unsafePath.paths);
  paths['/api/v1/../hosts'] = paths['/api/v1/search/hosts'];
  delete paths['/api/v1/search/hosts'];
  assert.throws(() => adaptPublicApiDocument(unsafePath), /path/);
});

test('new spec configuration is optional and distinct from the retired docs URL setting', () => {
  assert.equal(readPublicSettings({}).apiSpecUrl, undefined);
  assert.equal(
    readPublicSettings({ VITE_APCO_API_SPEC_URL: ' https://docs.example.test/client.json ' })
      .apiSpecUrl,
    'https://docs.example.test/client.json',
  );
  const legacy = {
    VITE_APCO_PRODUCT_URL: 'https://apcosys.net',
    VITE_APCO_API_DOCS_URL: 'https://example.test/legacy',
  };
  assert.deepEqual(readPublicSettings(legacy), readPublicSettings({}));
});

for (const url of [
  'javascript:alert(1)',
  'https://user:secret@example.test/spec.json',
  'https://example.test/spec.json#fragment',
  'http://docs.example.test/spec.json',
  'http://127.0.0.2/spec.json',
]) {
  test('unsafe spec setting is rejected before loading: ' + url, () => {
    assert.throws(
      () => readPublicSettings({ VITE_APCO_API_SPEC_URL: url }),
      /VITE_APCO_API_SPEC_URL/,
    );
  });
}

test('loopback HTTP is limited to explicit supported local development hosts', () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]'])
    assert.equal(
      publicApiSpecUrl('http://' + hostname + ':5191/client.json'),
      'http://' + hostname + ':5191/client.json',
    );
});
