/** Product allowances are defined once; all pricing and API views derive from this record. */
export type PlanDefinition = {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  users: number;
  action: string;
  searchFilters: string;
  cveContext: boolean;
  buckets: boolean;
  leakedData: boolean;
  privateScanner: boolean;
  api: boolean;
};
export const businessPlan = {
  id: 'business',
  name: 'BUSINESS',
  description: 'Team research & API access',
  price: 900,
  credits: 1500000,
  users: 5,
  action: 'Choose Business',
  api: true,
  searchFilters: 'Advanced · full filters',
  cveContext: true,
  buckets: true,
  leakedData: true,
  privateScanner: true,
} as const satisfies PlanDefinition;

export const plans = [
  {
    id: 'free',
    name: 'FREE',
    description: 'Personal introduction',
    price: 0,
    credits: 500,
    users: 1,
    action: 'Open Apcosys',
    api: false,
    searchFilters: 'Basic',
    cveContext: false,
    buckets: false,
    leakedData: false,
    privateScanner: false,
  },
  {
    id: 'plus',
    name: 'PLUS',
    description: 'Host analytics & API access',
    price: 50,
    credits: 25000,
    users: 1,
    action: 'Choose Plus',
    api: true,
    searchFilters: 'Extended',
    cveContext: true,
    buckets: true,
    leakedData: false,
    privateScanner: false,
  },
  {
    id: 'expert',
    name: 'EXPERT',
    description: 'Advanced search & full filters',
    price: 300,
    credits: 250000,
    users: 1,
    action: 'Choose Expert',
    api: true,
    searchFilters: 'Advanced · full filters',
    cveContext: true,
    buckets: true,
    leakedData: true,
    privateScanner: false,
  },
  businessPlan,
] as const satisfies readonly PlanDefinition[];

export type Plan = (typeof plans)[number];

/** Search-credit weights from the documented client HTTP API contract (2026-11-07-draft).
 * Source: https://api.apcosys.net/api/v1/client.openapi.json
 * Analytics is the default for 12 enabled facets; actual weight is ceil(enabled facets / 4).
 * These weights do not describe the account's request-rate limiter.
 */
export const httpApiCreditWeights = {
  hosts: 1,
  analytics: 3,
  buckets: 1,
  bucketAnalytics: 1,
} as const;
