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
} & ({ api: false; apiRequestsPerSecond: null } | { api: true; apiRequestsPerSecond: number });
export const businessPlan = {
  id: 'business',
  name: 'BUSINESS',
  description: 'Team research & API access',
  price: 900,
  credits: 1500000,
  users: 5,
  action: 'Choose Business',
  api: true,
  apiRequestsPerSecond: 5,
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
    apiRequestsPerSecond: null,
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
    apiRequestsPerSecond: 1,
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
    apiRequestsPerSecond: 2,
    searchFilters: 'Advanced · full filters',
    cveContext: true,
    buckets: true,
    leakedData: true,
    privateScanner: false,
  },
  businessPlan,
] as const satisfies readonly PlanDefinition[];

export type Plan = (typeof plans)[number];

/** Published HTTP API method costs (rate allowance), not a conversion to plan credits.
 * Source: https://apcosys.net/docs/api, verified 24 October 2026.
 */
export const httpApiMethodCosts = {
  hosts: 1,
  analytics: 3,
  buckets: 1,
  bucketAnalytics: 1,
  other: 1,
} as const;
