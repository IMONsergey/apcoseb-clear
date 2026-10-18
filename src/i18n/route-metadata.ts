import { localizedRoutes } from './localized-routes';

/** Canonical English source strings for localized page titles and descriptions. */
export const localizedMetadata = {
  '/': {
    title: 'Start with a query. Follow what you find.',
    description:
      'Search internet-facing hosts by IP, domain, port, service or technology, see what runs on them and refine your search as you go.',
  },
  '/platform/search-investigation': {
    title: 'Every investigation starts with a question.',
    description:
      'Turn a technical question into a query, review the hosts that match and open each one to see the services, technologies and context behind it.',
  },
  '/platform/data-methodology': {
    title: 'Know what’s behind every result.',
    description:
      'How Apcosys collects internet infrastructure data, what each data type means, and how to read the context attached to an observation.',
  },
  '/platform/monitoring': {
    title: 'Understand what changes across your exposure.',
    description:
      'Compare infrastructure observations, review what changed and carry the relevant evidence into an investigation. Explore the proposed workflow below.',
  },
  '/use-cases/bug-bounty': {
    title: 'More to test inside your scope.',
    description:
      'Map internet-facing infrastructure related to an authorised programme, see what runs on it and decide where to look first.',
  },
  '/use-cases/vulnerability-research': {
    title: 'See where a technology runs.',
    description:
      'Search for observed products and versions, explore the infrastructure around them and evaluate potential vulnerability context.',
  },
  '/use-cases/osint-threat-investigation': {
    title: 'Turn one indicator into a clearer picture.',
    description:
      'Use observable technical attributes to investigate the internet-facing infrastructure behind a lead.',
  },
  '/teams': {
    title: 'Internet intelligence for your security team.',
    description:
      'Give analysts a common source of technical evidence about internet-facing infrastructure — from the first indicator to the context behind it.',
  },
  '/developers/api': {
    title: 'Apcosys data, in your own code.',
    description:
      'Query hosts, services and technologies programmatically and use the results in scripts, pipelines, reports and internal tools.',
  },
  '/pricing': {
    title: 'Choose the access your research needs.',
    description:
      'Start free. Upgrade when you need more searches, deeper filters, API access or a team.',
  },
  '/contact': {
    title: 'Talk to the Apcosys team.',
    description:
      'Questions about data, API access, team plans or procurement? Choose a topic and tell us what you need.',
  },
} as const satisfies Record<
  (typeof localizedRoutes)[number],
  { title: string; description: string }
>;

export function localizedMetadataSource(path: string) {
  return localizedMetadata[path as keyof typeof localizedMetadata] ?? null;
}
