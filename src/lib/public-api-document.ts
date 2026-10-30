import { publicApiSpecUrl } from './public-api-url';
export { publicApiSpecUrl } from './public-api-url';
export { compilePublicApiDocument } from './public-api-compile';

/** The bounded documentation profile, not a general OpenAPI validator or API client. */
type ObjectValue = Record<string, unknown>;

export type ApiField = {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
};

const operationSections = {
  'search-hosts': 'search-hosts',
  'get-host': 'host-details',
  'host-analytics': 'analytics',
  'search-buckets': 'search-buckets',
  'bucket-analytics': 'bucket-analytics',
  'private-hosts': 'private-search',
  'get-private-host': 'private-search',
  'private-analytics': 'private-search',
} as const;
export type PublicApiOperationId = keyof typeof operationSections;
export const publicApiOperationIds = Object.keys(operationSections) as PublicApiOperationId[];

export type ApiOperation = {
  operationId: PublicApiOperationId;
  sectionId: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  plans: string[];
  creditWeight: string;
  methodName: string;
  requestFields: ApiField[];
  responseFields: ApiField[];
  requestExample: string;
  responseExample: string;
  notes: string[];
};

function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object in the public API documentation.');
  return value as ObjectValue;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 20000)
    throw new Error('Expected bounded public API documentation text.');
  return value;
}
function optionalText(value: unknown): string {
  return value === undefined ? '' : text(value);
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 1000)
    throw new Error('Expected a bounded public API documentation list.');
  return value;
}
function strings(value: unknown): string[] {
  return list(value).map(text);
}
function finite(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error('Expected a nonnegative public API documentation number.');
  return value;
}
function plain(value: string): string {
  return value.replace(/`([^`]+)`/g, '$1');
}

function shellQuote(value: string): string {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}

/** No remote refs are loaded, no HTML is interpreted, and examples are never executed. */
export function adaptPublicApiDocument(input: unknown) {
  const root = object(input);
  if (root.openapi !== '3.1.1') throw new Error('Unsupported OpenAPI documentation version.');
  const info = object(root.info);
  const version = text(info.version);
  const source = object(root['x-apcosys-source-document']);
  const sourceName = text(source.name);
  const sourceSha256 = text(source.sha256);
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error('Missing source provenance.');
  const servers = list(root.servers);
  if (servers.length !== 1) throw new Error('Exactly one root API server is required.');
  const server = object(servers[0]);
  const serverUrl = publicApiSpecUrl(text(server.url)).replace(/\/$/, '');
  const serverAddress = new URL(serverUrl);
  if (serverAddress.search || serverAddress.hash)
    throw new Error('API server URLs cannot contain a query or fragment.');

  // Raw-tree limits do not bound repeated expansion of an acyclic shared schema DAG.
  // Keep one work budget for this whole parse, including refs, type labels and property copies.
  let projectionWork = 0;
  function consumeProjectionWork(amount = 1): void {
    projectionWork += amount;
    if (projectionWork > 50000) throw new Error('OpenAPI schema projection work limit exceeded.');
  }

  function pointer(ref: string): ObjectValue {
    if (!ref.startsWith('#/')) throw new Error('External OpenAPI references are not supported.');
    let value: unknown = root;
    for (const part of ref.slice(2).split('/')) {
      consumeProjectionWork();
      if (/~(?![01])/u.test(part)) throw new Error('Malformed local OpenAPI reference.');
      const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
      const record = object(value);
      if (!Object.hasOwn(record, key)) throw new Error('Unresolved local OpenAPI reference.');
      value = record[key];
    }
    return object(value);
  }
  // Resolve direct reference chains only. Recursive schema properties remain references.
  function resolve(value: unknown, seen: string[] = []): ObjectValue {
    consumeProjectionWork();
    const record = object(value);
    if (record.$ref === undefined) return record;
    const ref = text(record.$ref);
    if (seen.includes(ref) || seen.length >= 32)
      throw new Error('Cyclic or excessive direct OpenAPI references.');
    const siblings = { ...record };
    delete siblings.$ref;
    return { ...resolve(pointer(ref), [...seen, ref]), ...siblings };
  }
  let nodes = 0;
  function checkTree(value: unknown, depth = 0): void {
    if (++nodes > 50000 || depth > 64) throw new Error('Excessive OpenAPI document complexity.');
    if (Array.isArray(value)) {
      value.forEach((child) => checkTree(child, depth + 1));
    } else if (value && typeof value === 'object') {
      const record = object(value);
      if (record.$ref !== undefined) resolve(record);
      Object.values(record).forEach((child) => checkTree(child, depth + 1));
    }
  }
  checkTree(root);

  function shape(value: unknown, depth = 0): { properties: ObjectValue; required: Set<string> } {
    consumeProjectionWork();
    if (depth > 24) throw new Error('Excessive schema composition.');
    const schema = resolve(value);
    const ownProperties = schema.properties ? object(schema.properties) : {};
    const required = new Set(schema.required ? strings(schema.required) : []);
    consumeProjectionWork(Object.keys(ownProperties).length + required.size);
    const properties: ObjectValue = Object.assign(
      Object.create(null) as ObjectValue,
      ownProperties,
    );
    for (const part of schema.allOf ? list(schema.allOf) : []) {
      const child = resolve(part);
      // Conditional refinements must not become unconditional field types.
      if (child.if !== undefined || child.then !== undefined || child.else !== undefined) continue;
      const branch = shape(child, depth + 1);
      consumeProjectionWork(Object.keys(branch.properties).length + branch.required.size);
      Object.assign(properties, branch.properties);
      branch.required.forEach((name) => required.add(name));
    }
    for (const union of [schema.anyOf, schema.oneOf]) {
      if (!union) continue;
      const branches = list(union).map((part) => shape(part, depth + 1));
      for (const branch of branches) {
        consumeProjectionWork(Object.keys(branch.properties).length);
        Object.assign(properties, branch.properties);
      }
      for (const name of branches[0]?.required ?? [])
        if (branches.every((branch) => branch.required.has(name))) required.add(name);
    }
    return { properties, required };
  }
  function typeName(value: unknown, depth = 0): string {
    consumeProjectionWork();
    if (depth > 12) return 'object';
    const schema = resolve(value);
    if (schema.type === 'array')
      return schema.items ? typeName(schema.items, depth + 1) + '[]' : 'array';
    if (Array.isArray(schema.type)) return strings(schema.type).join(' | ');
    if (typeof schema.type === 'string') return schema.type;
    const variants = schema.anyOf ?? schema.oneOf ?? schema.allOf;
    if (variants)
      return [...new Set(list(variants).map((part) => typeName(part, depth + 1)))].join(' | ');
    return schema.properties ? 'object' : 'any';
  }
  function fields(value: unknown, prefix = ''): ApiField[] {
    const { properties, required } = shape(value);
    return Object.entries(properties).map(([name, property]) => {
      const schema = resolve(property);
      const details = [optionalText(schema.description), optionalText(schema['x-contract-note'])];
      if (schema.enum) details.push('Allowed values: ' + list(schema.enum).map(String).join(', '));
      return {
        name: prefix + name,
        type: typeName(schema),
        description: plain(details.filter(Boolean).join(' ')),
        required: required.has(name),
        ...(schema.default === undefined ? {} : { defaultValue: JSON.stringify(schema.default) }),
      };
    });
  }
  function property(value: unknown, name: string): ObjectValue {
    const entry = shape(value).properties[name];
    if (entry === undefined) throw new Error('Unsupported documentation schema shape.');
    return resolve(entry);
  }
  function items(value: unknown): ObjectValue {
    return resolve(resolve(value).items);
  }
  function media(value: unknown): ObjectValue {
    return object(object(resolve(value).content)['application/json']);
  }
  function example(value: ObjectValue): unknown {
    if (Object.hasOwn(value, 'example')) return value.example;
    const first = Object.values(object(value.examples))[0];
    const entry = resolve(first);
    if (!Object.hasOwn(entry, 'value')) throw new Error('Missing documented JSON example.');
    return entry.value;
  }
  function renderExample(value: unknown): string {
    const result = JSON.stringify(value, null, 2);
    if (!result || result.length > 100000) throw new Error('Invalid documented JSON example.');
    return result;
  }

  const schemes = object(object(root.components).securitySchemes);
  const authentication = object(root['x-apcosys-authentication']);
  const header = text(authentication.header);
  const security = (value: unknown): void => {
    const alternatives = list(value);
    if (!alternatives.length) throw new Error('The public API requires API-key authentication.');
    for (const alternative of alternatives) {
      const names = Object.keys(object(alternative));
      if (names.length !== 1) throw new Error('Unsupported authentication alternative.');
      const scheme = resolve(schemes[names[0]!]);
      if (scheme.type !== 'apiKey' || scheme.in !== 'header' || scheme.name !== header)
        throw new Error('Unsupported public API authentication scheme.');
    }
  };
  if (header !== 'X-API-Key' || authentication.all_routes_require_key !== true)
    throw new Error('Unsupported public API authentication profile.');
  security(root.security);

  const requests = new Map<PublicApiOperationId, ObjectValue>();
  const responses = new Map<PublicApiOperationId, ObjectValue>();
  const operations = new Map<PublicApiOperationId, ApiOperation>();
  const allowed = object(root['x-apcosys-plan-method-allow-list']);
  const paths = object(root.paths);
  for (const [path, rawPath] of Object.entries(paths)) {
    if (
      !/^\/(?:[A-Za-z0-9_.~-]+|\{[A-Za-z_][A-Za-z0-9_]*\})(?:\/(?:[A-Za-z0-9_.~-]+|\{[A-Za-z_][A-Za-z0-9_]*\}))*$/.test(
        path,
      ) ||
      path.split('/').some((segment) => segment === '.' || segment === '..')
    )
      throw new Error('Unsupported public API path.');
    const pathItem = resolve(rawPath);
    if (Object.hasOwn(pathItem, 'servers'))
      throw new Error('Path-level API server overrides are not supported.');
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (['summary', 'description', 'parameters'].includes(method) || method.startsWith('x-'))
        continue;
      if (!['get', 'post'].includes(method)) throw new Error('Unsupported public API operation.');
      const operation = resolve(rawOperation);
      if (Object.hasOwn(operation, 'servers'))
        throw new Error('Operation-level API server overrides are not supported.');
      const id = text(operation.operationId);
      if (!Object.hasOwn(operationSections, id) || id !== operation['x-apcosys-doc-id'])
        throw new Error('Unsupported public API documentation operation id.');
      const operationId = id as PublicApiOperationId;
      if (operations.has(operationId)) throw new Error('Duplicate public API operation id.');
      const expectedMethod = id.startsWith('get-') ? 'get' : 'post';
      if (method !== expectedMethod) throw new Error('Unexpected public API operation method.');
      security(operation.security ?? root.security);
      const plans = strings(operation['x-apcosys-plans']);
      const methodName = text(operation['x-apcosys-method-name']);
      if (JSON.stringify(plans) !== JSON.stringify(strings(allowed[methodName])))
        throw new Error('Conflicting API method allow-list.');
      const weight = operation['x-apcosys-credit-weight'];
      if (typeof weight !== 'string') finite(weight);
      const creditWeight = typeof weight === 'string' ? text(weight) : String(weight);
      const response = media(object(operation.responses)['200']);
      const responseSchema = resolve(response.schema);
      responses.set(operationId, responseSchema);
      let requestFields: ApiField[] = [];
      let requestBody: unknown;
      if (method === 'post') {
        const request = media(operation.requestBody);
        const requestSchema = resolve(request.schema);
        requests.set(operationId, requestSchema);
        requestFields = fields(requestSchema);
        requestBody = example(request);
      }
      let examplePath = path;
      for (const rawParameter of [
        ...(pathItem.parameters ? list(pathItem.parameters) : []),
        ...(operation.parameters ? list(operation.parameters) : []),
      ]) {
        const parameter = resolve(rawParameter);
        if (parameter.in !== 'path') continue;
        const name = text(parameter.name);
        const sample = example(parameter);
        if (typeof sample !== 'string') throw new Error('Invalid path-parameter example.');
        examplePath = examplePath.replace('{' + name + '}', encodeURIComponent(sample));
      }
      if (examplePath.includes('{')) throw new Error('Missing path-parameter example.');
      const requestExample =
        'curl -sS' +
        (method === 'post' ? ' -X POST' : '') +
        ' ' +
        shellQuote(serverUrl + examplePath) +
        ' \\\n  -H "X-API-Key: $APCOSYS_API_KEY"' +
        (method === 'post'
          ? ' \\\n  -H "Content-Type: application/json" \\\n  -d ' +
            shellQuote(renderExample(requestBody))
          : '');
      operations.set(operationId, {
        operationId,
        sectionId: operationSections[operationId],
        method: method.toUpperCase() as 'GET' | 'POST',
        path,
        title: text(operation.summary),
        description: plain(text(operation.description)),
        plans,
        creditWeight,
        methodName,
        requestFields,
        responseFields: fields(responseSchema),
        requestExample,
        responseExample: renderExample(example(response)),
        notes: [optionalText(operation['x-contract-note'])].filter(Boolean).map(plain),
      });
    }
  }
  if (operations.size !== publicApiOperationIds.length)
    throw new Error('The documentation profile requires all eight public operations.');
  const endpoints = publicApiOperationIds.map((id) => operations.get(id)!);
  const byId = Object.fromEntries(
    endpoints.map((operation) => [operation.operationId, operation]),
  ) as Record<PublicApiOperationId, ApiOperation>;
  const hostRequest = requests.get('search-hosts')!;
  const hostResponse = responses.get('search-hosts')!;
  const host = responses.get('get-host')!;
  const port = items(property(host, 'ports'));
  const analytics = responses.get('host-analytics')!;
  const facet = items(property(analytics, 'facets'));
  const bucket = responses.get('search-buckets')!;
  const bucketAnalytics = responses.get('bucket-analytics')!;
  const filter = items(property(hostRequest, 'simple_search_filters'));
  const syntax = object(root['x-apcosys-filter-syntax']);
  const filterCatalogue = new Map<string, [string, string, string][]>();
  for (const rawField of list(root['x-apcosys-filter-catalog'])) {
    const field = object(rawField);
    const group = text(field.group);
    const rows = filterCatalogue.get(group) ?? [];
    rows.push([text(field.field), text(field.type), plain(text(field.description))]);
    filterCatalogue.set(group, rows);
  }
  if (!filterCatalogue.size) throw new Error('Missing public API filter catalog.');
  const errors = new Map<number, { error: string; when: string }[]>();
  for (const rawError of list(root['x-apcosys-error-catalog'])) {
    const error = object(rawError);
    const status = finite(error.status);
    if (!Number.isInteger(status) || status < 400 || status > 599)
      throw new Error('Invalid documented HTTP error status.');
    const rows = errors.get(status) ?? [];
    rows.push({ error: text(error.error), when: plain(text(error.when)) });
    errors.set(status, rows);
  }
  if (!errors.size) throw new Error('Missing public API error catalog.');
  const restrictions = object(root['x-apcosys-plan-field-restrictions']);
  const planNames = [...new Set(Object.values(allowed).flatMap(strings))];
  const planRestrictions = planNames.map((plan) => {
    const row = object(restrictions[plan]);
    return {
      plan,
      fields: strings(row.blocked_fields),
      values: strings(row.blocked_values),
      hiddenFields: strings(row.hidden_result_fields),
    };
  });
  const rate = object(root['x-apcosys-rate-limit']);
  const credits = object(root['x-apcosys-credit-policy']);
  if (rate.pricing_api_rate_limit_used !== false || credits.balance_returned_in_http_body !== false)
    throw new Error('Unsupported rate-limit or credit-policy profile.');
  const notes = list(root['x-apcosys-contract-notes']).map((value) => {
    const note = object(value);
    return { id: text(note.id), note: plain(text(note.note)) };
  });
  return {
    openapi: '3.1.1',
    version,
    title: text(info.title),
    description: plain(text(info.description)),
    source: { name: sourceName, sha256: sourceSha256 },
    serverUrl,
    endpoints,
    byId,
    authenticationNote: plain(text(authentication.note)),
    planRestrictions,
    rate: {
      scope: plain(text(rate.scope)),
      tokensPerSecond: finite(rate.default_tokens_per_second),
      burst: finite(rate.default_burst),
      failureMode: plain(text(rate.failure_mode)),
    },
    credits: {
      balanceOwner: plain(text(credits.balance_owner)),
      reuseSeconds: finite(credits.charge_reuse_seconds),
      reuseScope: plain(text(credits.charge_reuse_scope)),
      bodyKey: plain(text(credits.body_key)),
      analyticsWeight: plain(text(credits.analytics_weight)),
      defaultAnalyticsWeight: finite(credits.default_analytics_weight),
    },
    hostSummaryFields: fields(items(property(hostResponse, 'hosts'))),
    portFields: fields(port),
    tlsFields: fields(property(port, 'tls_info')),
    securityTxtFields: fields(property(port, 'security_txt')),
    robotsTxtFields: fields(property(port, 'robots_txt')),
    productFields: fields(items(property(port, 'detected_products'))),
    privatePortFields: fields(items(property(responses.get('get-private-host')!, 'ports'))),
    analyticsFields: [
      ...fields(analytics),
      ...fields(facet, 'facets[].'),
      ...fields(items(property(facet, 'facet_values')), 'facets[].facet_values[].'),
    ],
    bucketFields: fields(items(property(bucket, 'result'))),
    bucketAnalyticsFields: [
      ...fields(bucketAnalytics),
      ...fields(items(property(bucketAnalytics, 'result')), 'result[].'),
    ],
    indexSelectionFields: Object.entries(object(root['x-apcosys-index-selection'])).map(
      ([name, value]) => ({
        name,
        type: Array.isArray(value) ? 'array' : typeof value,
        description: plain(typeof value === 'string' ? value : JSON.stringify(value)),
        required: false,
      }),
    ),
    filterFields: fields(filter),
    filterDescription: plain(text(filter.description)),
    filterExample: renderExample(list(filter.examples)[0]),
    rangeFields: fields(items(property(hostRequest, 'range_filter'))),
    privateFields: fields(requests.get('private-hosts')!).filter(({ name }) =>
      ['task_ids', 'user_name'].includes(name),
    ),
    valueSyntax: list(syntax.rules).map((value) => {
      const rule = object(value);
      return {
        name: plain(text(rule.form)),
        description: plain(text(rule.fields) + ': ' + text(rule.meaning)),
      };
    }),
    headerNote: plain(text(syntax.named_header_empty_value)),
    headerExample:
      [...filterCatalogue.values()].flat().find(([name]) => name === 'headers.{Name}')?.[2] ?? '',
    errorExample: renderExample(object(rate.rejection).body),
    aliases: Object.entries(object(syntax.aliases)).map(([name, value]) => ({
      name,
      value: text(value),
    })),
    filterCatalogue: [...filterCatalogue].map(([title, rows]) => ({ title, fields: rows })),
    errors: [...errors].sort(([a], [b]) => a - b).map(([code, rows]) => ({ code, rows })),
    notes,
  };
}

export type PublicApiDocument = ReturnType<typeof adaptPublicApiDocument>;
