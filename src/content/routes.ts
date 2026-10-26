import { legalRoutes } from './legal-routes';

/** Published routes, page metadata and lazy-loading groups. */
export const siteRoutes = [
  {
    path: '/',
    group: 'home',
    title: 'Start with a query. Follow what you find.',
    description:
      'Explore internet-facing infrastructure, services and technical context with Apcosys.',
  },
  {
    path: '/platform/search-investigation',
    group: 'platform',
    title: 'Search & Investigation',
    description: 'Follow the research journey from technical query to host and context.',
  },
  {
    path: '/platform/data-methodology',
    group: 'platform',
    title: 'Data & Methodology',
    description: 'Understand the observations, coverage and limits behind Apcosys data.',
  },
  {
    path: '/platform/monitoring',
    group: 'platform',
    title: 'Monitoring concept',
    description: 'Explore a concept for observing changes to internet-facing infrastructure.',
  },
  {
    path: '/use-cases/bug-bounty',
    group: 'research',
    title: 'Bug Bounty',
    description: 'Investigate infrastructure within an authorised bug bounty scope.',
  },
  {
    path: '/use-cases/vulnerability-research',
    group: 'research',
    title: 'Vulnerability Research',
    description: 'Study technologies and potential CVE associations as research signals.',
  },
  {
    path: '/use-cases/osint-threat-investigation',
    group: 'research',
    title: 'OSINT & Threat Investigation',
    description: 'Follow observed internet infrastructure indicators and technical context.',
  },
  {
    path: '/teams',
    group: 'research',
    title: 'Security Teams',
    description: 'Evaluate Apcosys search, data and API access for your security team.',
  },
  {
    path: '/developers/api',
    group: 'commercial',
    title: 'API',
    description: 'Integrate Apcosys internet infrastructure data into your workflows.',
  },
  {
    path: '/developers/api/docs',
    group: 'documentation',
    title: 'API Documentation',
    description: 'HTTP endpoints, filters, response fields and errors for Apcosys integrations.',
  },
  {
    path: '/pricing',
    group: 'commercial',
    title: 'Pricing',
    description: 'Compare Apcosys plans, credits, limits and API access.',
  },
  {
    path: '/about',
    group: 'corporate',
    title: 'About',
    description: 'Learn about the approach behind Apcosys internet intelligence.',
  },
  {
    path: '/docs/investors',
    group: 'investors',
    title: 'Investors',
    description:
      'Explore Apcosys external exposure intelligence and contact the team about investment.',
  },
  {
    path: '/responsible-scanning',
    group: 'corporate',
    title: 'Responsible Scanning',
    description: 'Learn about responsible infrastructure observations and contact Apcosys.',
  },
  {
    path: '/contact',
    group: 'corporate',
    title: 'Talk to Us',
    description: 'Contact Apcosys about data, teams, API access, billing or scanning.',
  },
  ...legalRoutes.map((route) => ({ ...route, group: 'legal' as const })),
] as const;

export type SitePath = (typeof siteRoutes)[number]['path'];

export type RouteGroup = (typeof siteRoutes)[number]['group'];
export type SiteLink = SitePath | `${SitePath}#${string}`;
