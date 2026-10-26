import { apiRequestExample, apiResponseExample } from './api-example';

/** Public HTTP reference: apcosys.net/docs/api, md-file-fIHrv7Eh.js. */
export const apiBaseUrl = 'https://api.apcosys.net/api/v1';

export type ApiField = {
  name: string;
  type: string;
  description: string;
  defaultValue?: string;
};

function field(name: string, type: string, description: string, defaultValue?: string): ApiField {
  return { name, type, description, ...(defaultValue === undefined ? {} : { defaultValue }) };
}

export const apiDocsNavigation = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'access-limits', label: 'Access & limits' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'search-hosts', label: 'Search hosts', nested: true },
  { id: 'host-details', label: 'Host details', nested: true },
  { id: 'analytics', label: 'Host analytics', nested: true },
  { id: 'search-buckets', label: 'Search buckets', nested: true },
  { id: 'bucket-analytics', label: 'Bucket analytics', nested: true },
  { id: 'private-search', label: 'Private search', nested: true },
  { id: 'filters', label: 'Filter syntax & fields' },
  { id: 'errors', label: 'Errors' },
  { id: 'best-practices', label: 'Integration guidance' },
] as const;

export const apiEndpoints = [
  { id: 'search-hosts', method: 'POST', path: '/search/hosts', title: 'Search hosts' },
  { id: 'host-details', method: 'GET', path: '/search/hosts/:ip', title: 'Host details' },
  { id: 'analytics', method: 'POST', path: '/search/analytics', title: 'Host analytics' },
  { id: 'search-buckets', method: 'POST', path: '/search/buckets', title: 'Search buckets' },
  {
    id: 'bucket-analytics',
    method: 'POST',
    path: '/search/buckets/analytics',
    title: 'Bucket analytics',
  },
  { id: 'private-search', method: 'POST', path: '/search/private/hosts', title: 'Private hosts' },
  {
    id: 'private-search',
    method: 'GET',
    path: '/search/private/hosts/:ip',
    title: 'Private host details',
  },
  {
    id: 'private-search',
    method: 'POST',
    path: '/search/private/analytics',
    title: 'Private analytics',
  },
] as const;

export const hostRequestFields = [
  field('page', 'integer', 'Result page number.', '1'),
  field('docs_per_page', 'integer', 'Records per page; at most 100 for host search.', '50'),
  field('sort_field', 'string', 'Ignored for host search: results use uts in descending order.'),
  field('sort_direction', 'string', 'Ignored for host search: the order is always descending.'),
  field(
    'full_text_search',
    'string',
    'Search banners, bodies, domains and headers; IP or CIDR text also searches addresses.',
  ),
  field('exposed_data', 'string', 'Search exposed-data content; requires Expert or Business.'),
  field('security_body', 'string', 'Search security.txt content; requires Business.'),
  field('simple_search_filters', 'array', 'Combine field/value filters and nested groups.'),
  field('min_size_mb', 'number', 'Minimum exposed-data size in MB; requires Expert or Business.'),
  field('max_size_mb', 'number', 'Maximum exposed-data size in MB; requires Expert or Business.'),
  field(
    'range_filter',
    'array',
    'Inclusive numeric or time ranges; field restrictions still apply.',
  ),
] as const;

export const hostSearchResponseFields = [
  field('total', 'integer', 'Total matching hosts across the result pages.'),
  field('page', 'integer', 'Result page number.'),
  field('docs_per_page', 'integer', 'Page size.'),
  field('hosts', 'array', 'Host summaries for this page.'),
] as const;

export const hostSummaryFields = [
  field('ip', 'string', 'IP address or host identifier; a domain may appear when the IP is empty.'),
  field('os', 'string', 'Operating system, when available.'),
  field('org', 'string', 'Organisation associated with the autonomous system.'),
  field('city_name', 'string', 'City name.'),
  field('country_code', 'string', 'Country code.'),
  field('region', 'string', 'Region name.'),
  field('uts', 'integer', 'Last update time in Unix seconds.'),
  field('labels_list', 'string[]', 'Labels attached to the host.'),
  field('open_ports', 'array', 'Service summaries with protocol and port.'),
] as const;

export const hostDetailFields = [
  field('ip', 'string', 'IP address or host identifier.'),
  field('type', 'string', 'Record type: ipv4, ipv6 or domain.'),
  field('as_cidr', 'string', 'Autonomous-system network block, when available.'),
  field('os', 'string', 'Operating system, when available.'),
  field('country_code', 'string', 'Country code.'),
  field('country_name', 'string', 'Country name.'),
  field('continent_name', 'string', 'Continent name.'),
  field('city_name', 'string', 'City name.'),
  field('region', 'string', 'Region name.'),
  field('region_code', 'string', 'Region code.'),
  field('asn', 'integer', 'Autonomous system number.'),
  field('org', 'string', 'Organisation associated with the autonomous system.'),
  field('cts', 'integer', 'Creation time in Unix seconds.'),
  field('uts', 'integer', 'Last update time in Unix seconds.'),
  field('ports', 'array', 'Detailed service records.'),
] as const;

export const portFields = [
  field('port', 'integer', 'Port number.'),
  field('protocol', 'string', 'Observed application protocol.'),
  field('banner', 'string', 'Service banner.'),
  field('transport', 'string', 'Transport protocol.'),
  field('uts', 'integer', 'Last update time in Unix seconds.'),
  field('status', 'string', 'Observation status, such as closed_port.'),
  field('tls_info', 'object', 'TLS and certificate fields in one flat object.'),
  field('detected_products', 'array', 'Detected technologies and associated context.'),
  field('banner_sha256', 'string', 'SHA-256 of the banner bytes, encoded as hexadecimal.'),
  field('favicon_md5', 'string', 'MD5 of the favicon bytes, encoded as hexadecimal.'),
  field('body', 'string', 'Observed response body.'),
  field('body_sha256', 'string', 'SHA-256 of the response body bytes, encoded as hexadecimal.'),
  field('title', 'string', 'Page or service title.'),
  field('status_code', 'integer', 'HTTP response status.'),
  field('headers', 'object', 'Header names mapped to arrays of values.'),
  field('cert_domains', 'string[]', 'Domains found in the certificate.'),
  field('redirects', 'string[]', 'Redirect chain; it may start with the constructed origin URL.'),
  field('link', 'string', 'Final URL, or the service origin when no redirect occurred.'),
  field('security_txt', 'object', 'Observed security.txt data.'),
  field('header_domains', 'string[]', 'Domains found in response headers.'),
  field('error', 'string', 'Observation error, if present.'),
] as const;

export const tlsFields = [
  field('tls_version', 'string', 'TLS version.'),
  field('cipher_suite', 'string', 'Negotiated cipher suite.'),
  field('server_name', 'string', 'Server name indication (SNI).'),
  field('sha256', 'string', 'SHA-256 of the certificate DER bytes, encoded as hexadecimal.'),
  field('ja4s', 'string', 'JA4S fingerprint.'),
  field('serial_number', 'string', 'Certificate serial number.'),
  field('issuer', 'string', 'Certificate issuer.'),
  field('subject', 'string', 'Certificate subject.'),
  field('not_before', 'string', 'Certificate validity start.'),
  field('not_after', 'string', 'Certificate validity end.'),
  field('dns_names', 'string[]', 'DNS names in the certificate.'),
  field('email_addresses', 'string[]', 'Email addresses in the certificate.'),
  field('ip_addresses', 'string[]', 'IP addresses in the certificate.'),
  field('uris', 'string[]', 'URIs in the certificate.'),
  field('public_key_algorithm', 'string', 'Public-key algorithm.'),
  field('signature_algorithm', 'string', 'Certificate signature algorithm.'),
  field('key_usage', 'string', 'Certificate key usage.'),
  field('ext_key_usage', 'array', 'Extended certificate key usage.'),
  field('is_ca', 'boolean', 'Whether the certificate belongs to a certificate authority.'),
  field('ocsp_server', 'string[]', 'OCSP server addresses.'),
  field('crl_distribution_points', 'string[]', 'Certificate revocation-list locations.'),
] as const;

export const securityTxtFields = [
  field('is_security_txt', 'boolean', 'Whether a security.txt file was found.'),
  field('body', 'string', 'Contents of the observed file.'),
  field('contacts', 'string[]', 'URLs or email addresses from Contact entries.'),
  field('url', 'string', 'Full URL of the observed file.'),
  field('endpoint', 'string', 'File path, such as /.well-known/security.txt.'),
] as const;

export const productFields = [
  field('product', 'string', 'Detected product name.'),
  field('vendor', 'string', 'Detected vendor name.'),
  field('version', 'string', 'Detected product version.'),
  field('labels', 'string[]', 'Labels attached to the detection.'),
  field('cve_product', 'string', 'Product name used for CVE context.'),
  field('cve_vendor', 'string', 'Vendor name used for CVE context.'),
  field('cve_identifier', 'string', 'Identifier used for CVE context.'),
  field('cve_list', 'array', 'Associated entries containing cve_id and base_score.'),
  field(
    'exposed_data',
    'object',
    'Expert/Business only: field_headers (string[]) and field_value (string[][]).',
  ),
] as const;

export const analyticsFields = [
  field('facets', 'array', 'Aggregation groups.'),
  field(
    'facets[].facet_name',
    'string',
    'Group name, such as type, port, products or country_name.',
  ),
  field('facets[].facet_values', 'array', 'Values and their counts for this group.'),
  field('facets[].facet_values[].key', 'string | number', 'Aggregation value.'),
  field('facets[].facet_values[].doc_count', 'integer', 'Count reported for this value.'),
] as const;

export const bucketRequestFields = [
  field('page', 'integer', 'Result page number.', '1'),
  field('docs_per_page', 'integer', 'Page size.', '50'),
  field('sort_field', 'string', 'Sort by cts, uts or size_mb.', 'cts'),
  field('sort_direction', 'string', 'Sort direction: asc or desc.', 'desc'),
  field('host', 'string', 'Storage host to match.'),
  field('stop_words', 'string[]', 'Stop words.'),
  field('min_size_mb', 'number', 'Minimum size in MB.'),
  field('max_size_mb', 'number', 'Maximum size in MB.'),
  field('key_words', 'string[]', 'Keywords to match.'),
  field('extensions', 'string[]', 'File extensions.'),
  field('alphabets', 'string[]', 'Alphabets, such as latin or cyrillic.'),
  field(
    'exclude_extensions',
    'boolean',
    'Exclude the listed extensions instead of including them.',
  ),
  field('gte_uts', 'integer', 'Inclusive lower bound for update time, in Unix seconds.'),
  field('lte_uts', 'integer', 'Inclusive upper bound for update time, in Unix seconds.'),
  field('gte_cts', 'integer', 'Inclusive lower bound for creation time, in Unix seconds.'),
  field('lte_cts', 'integer', 'Inclusive upper bound for creation time, in Unix seconds.'),
  field('country_code_include', 'string[]', 'Country codes to include.'),
  field('country_code_exclude', 'string[]', 'Country codes to exclude.'),
  field('excluded_buckets', 'string[]', 'Buckets to exclude.'),
  field('product_names', 'string[]', 'Product names to match.'),
] as const;

export const bucketResponseFields = [
  field('result_count', 'integer', 'Number of items in this response.'),
  field('result', 'array', 'Matching storage records.'),
] as const;

export const bucketFields = [
  field('host', 'string', 'Storage host.'),
  field('protocol', 'string', 'HTTP or HTTPS.'),
  field('key', 'string', 'Storage key or name.'),
  field('container', 'string', 'Container name, when present.'),
  field('alphabets', 'string[]', 'Detected alphabets.'),
  field('alias_hosts', 'string[]', 'Alternative hostnames, when present.'),
  field('cts', 'integer', 'Creation time in Unix seconds.'),
  field('uts', 'integer', 'Last update time in Unix seconds.'),
  field('size_mb', 'number', 'Size in MB.'),
  field('extension', 'string', 'File extension.'),
] as const;

export const bucketAnalyticsFields = [
  field('result_count', 'integer', 'Number of items in this response.'),
  field('result', 'array', 'Storage hosts and file counts.'),
  field('result[].host', 'string', 'Storage host.'),
  field('result[].file_count', 'integer', 'File count for this host.'),
] as const;

export const filterFields = [
  field('field', 'string', 'Required for a leaf filter: the field name.'),
  field('value', 'string', 'Required for a leaf filter: a non-empty value.'),
  field('operator', 'string', 'AND, OR or NOT.', 'AND'),
  field('filters', 'array', 'Nested filters with the same structure.'),
] as const;

export const rangeFields = [
  field('field', 'string', 'Numeric or time field, such as uts, cts, port_count or base_score.'),
  field('start', 'number', 'Inclusive lower bound (gte).'),
  field('end', 'number', 'Inclusive upper bound (lte).'),
] as const;

export const privateFields = [
  field(
    'task_ids',
    'string[]',
    'Optional task IDs that limit private host search or analytics to those scans.',
  ),
] as const;

export const restrictedFields = [
  { name: 'cve_id, base_score', plan: 'Plus' },
  { name: 'exposed_data, min_size_mb, max_size_mb, cts, uts, port_count', plan: 'Expert' },
  { name: 'security_body', plan: 'Business' },
] as const;

export const restrictedValues = [
  { name: 'vulnerability, bucket', plan: 'Plus' },
  { name: 'leak', plan: 'Expert' },
  { name: 'security_txt', plan: 'Business' },
] as const;

export const valueSyntax = [
  { name: 'nginx', description: 'Plain values use the matching rules of the field.' },
  { name: '"Welcome to nginx"', description: 'Quoted text matches a phrase in text fields.' },
  { name: '(apache httpd)', description: 'Parentheses require all words in a text field.' },
  { name: 'ngin*', description: 'Asterisks and question marks are wildcards for keyword fields.' },
  { name: '80,443', description: 'Comma-separated values match any listed value.' },
] as const;

export const filterCatalogue = [
  {
    title: 'Host and location',
    fields: [
      ['ip', 'ip', '203.0.113.10'],
      ['cidr', 'ip', '203.0.113.0/24'],
      ['domain', 'keyword', 'example.com'],
      ['as_cidr', 'keyword', '203.0.113.0/24'],
      ['type', 'keyword', 'ipv4 / ipv6 / domain'],
      ['asn', 'long', '64500'],
      ['org', 'keyword', 'Example Research Network'],
      ['country_code', 'keyword', 'US'],
      ['country_name', 'keyword', 'United States'],
      ['continent_name', 'keyword', 'North America'],
      ['city_name', 'keyword', 'New York'],
      ['region', 'keyword', 'New York'],
      ['region_code', 'keyword', 'NY'],
      ['os', 'keyword', 'Linux'],
      ['port_count', 'long', '2'],
    ],
  },
  {
    title: 'Ports and services',
    fields: [
      ['port', 'integer', '443'],
      ['protocol', 'keyword', 'https'],
      ['transport', 'keyword', 'tcp'],
      ['status_code', 'integer', '200'],
      ['title', 'text', 'Welcome to nginx'],
      ['banner', 'text', 'SSH-2.0-OpenSSH'],
      ['body', 'text', 'nginx'],
      ['banner_sha256', 'keyword', 'SHA-256'],
      ['body_sha256', 'keyword', 'SHA-256'],
      ['favicon_md5', 'keyword', 'MD5'],
      ['redirects', 'text', 'https://example.com/'],
    ],
  },
  {
    title: 'Products and vulnerability context',
    fields: [
      ['products', 'keyword[]', 'nginx'],
      ['vendors', 'keyword[]', 'nginx'],
      ['cve_id', 'keyword', 'CVE-2021-*'],
      ['base_score', 'float', '9.8'],
      ['labels', 'keyword[]', 'web'],
      ['exposed_data', 'text', 'example'],
    ],
  },
  {
    title: 'HTTP headers and TLS',
    fields: [
      ['headers.k', 'nested keyword', 'Server'],
      ['headers.v', 'nested text', 'nginx'],
      ['headers.{Name} / header.{Name}', 'nested', 'headers.Server: nginx'],
      ['tls_info.server_name', 'keyword', 'example.com'],
      ['tls_info.tls_version', 'keyword', 'TLS 1.3'],
      ['tls_info.cipher_suite', 'keyword', 'TLS_AES_128_GCM_SHA256'],
      ['tls_info.ja4s', 'keyword', 'JA4S'],
      ['tls_info.serial_number', 'keyword', '01'],
      ['tls_info.issuer', 'text', 'Example CA'],
      ['tls_info.subject', 'text', 'example.com'],
      ['tls_info.sha256', 'keyword', 'SHA-256'],
    ],
  },
  {
    title: 'Security contact and time',
    fields: [
      ['security_body', 'text', 'security@example.com'],
      ['cts', 'date / long', '1792768164'],
      ['uts', 'date / long', '1792768164'],
    ],
  },
] as const;

export const apiErrors = [
  {
    code: 400,
    title: 'Invalid request',
    description: 'Check the JSON body, parameter types and host identifier.',
  },
  {
    code: 401,
    title: 'Invalid API key',
    description: 'Check that X-API-Key contains a valid account key.',
  },
  {
    code: 402,
    title: 'Plan restriction',
    description:
      'A field or value is unavailable on the current plan. Read the error message before changing the query.',
  },
  {
    code: 404,
    title: 'Host not found',
    description: 'The individual host lookup did not find the requested address or domain.',
  },
  {
    code: 429,
    title: 'Rate limit exceeded',
    description: 'Reduce request frequency before retrying.',
  },
  {
    code: 500,
    title: 'Search or server error',
    description:
      'Read the error message; an unsupported search field can also produce this status.',
  },
] as const;

function curl(method: 'GET' | 'POST', path: string, body?: object) {
  return [
    `curl --request ${method} "${apiBaseUrl}${path}" \\`,
    `  --header "X-API-Key: $APCOSYS_API_KEY"${body ? ' \\' : ''}`,
    ...(body
      ? ['  --header "Content-Type: application/json" \\', `  --data '${JSON.stringify(body)}'`]
      : []),
  ].join('\n');
}

export const apiDocExamples = {
  hosts: apiRequestExample,
  hostsResponse: apiResponseExample,
  host: curl('GET', '/search/hosts/203.0.113.10'),
  analytics: curl('POST', '/search/analytics', {
    simple_search_filters: [{ field: 'products', value: 'nginx' }],
  }),
  analyticsResponse: JSON.stringify(
    { facets: [{ facet_name: 'protocol', facet_values: [{ key: 'https', doc_count: 1 }] }] },
    null,
    2,
  ),
  buckets: curl('POST', '/search/buckets', {
    page: 1,
    docs_per_page: 20,
    sort_field: 'cts',
    sort_direction: 'desc',
  }),
  bucketAnalytics: curl('POST', '/search/buckets/analytics', { extensions: ['csv'] }),
  privateHosts: curl('POST', '/search/private/hosts', { page: 1, docs_per_page: 20 }),
  privateHost: curl('GET', '/search/private/hosts/203.0.113.10'),
  privateAnalytics: curl('POST', '/search/private/analytics', { full_text_search: 'nginx' }),
  nested: JSON.stringify(
    {
      simple_search_filters: [
        {
          operator: 'OR',
          filters: [
            { field: 'port', value: '80' },
            { field: 'port', value: '443' },
          ],
        },
        { field: 'products', value: 'nginx' },
      ],
    },
    null,
    2,
  ),
  header: curl('POST', '/search/hosts', {
    simple_search_filters: [{ field: 'headers.Server', value: 'nginx' }],
  }),
  error: JSON.stringify({ error: 'host not found' }, null, 2),
} as const;
