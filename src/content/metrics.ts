/** Dated public statistics snapshot. Counting rules are not inferred from field names. */
export const metricsSource = {
  url: 'https://api.apcosys.net/api/statistics',
  timestamp: '2026-10-23T15:09:24.000Z',
} as const;

export const metrics = [
  { id: 'ipv4', label: 'IPv4', value: 117_699_441 },
  { id: 'ipv6', label: 'IPv6', value: 161_719_645 },
  { id: 'domains', label: 'Domains', value: 839_953_442 },
  { id: 'products', label: 'Products', value: 1_348_017_100 },
  { id: 'cves', label: 'CVEs', value: 794_597 },
  { id: 'protocols', label: 'Protocols', value: 54 },
] as const;
