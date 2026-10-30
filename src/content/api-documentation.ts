import { hydratePublicApiDocument } from '../lib/public-api-view';

/** Vite validates the one canonical snapshot and embeds its view only in this lazy route. */
export const bundledApiDocumentation = hydratePublicApiDocument(__APCO_PUBLIC_API_DOCUMENT__);

/** Authored navigation labels retain their existing translations; contract prose stays sourced. */
export const apiOperationLabels = {
  'search-hosts': 'Search hosts',
  'get-host': 'Host details',
  'host-analytics': 'Host analytics',
  'search-buckets': 'Search buckets',
  'bucket-analytics': 'Bucket analytics',
  'private-hosts': 'Private hosts',
  'get-private-host': 'Private host details',
  'private-analytics': 'Private analytics',
} as const;

/** Stable section anchors are independent of contract operation names and paths. */
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
