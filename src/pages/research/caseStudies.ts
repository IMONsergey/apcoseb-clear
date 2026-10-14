import { linkTo } from '../../components/layout/pageLinks';

export const caseStudies = {
  '/use-cases/bug-bounty': {
    title: 'More to test inside your scope.',
    description:
      'Map internet-facing infrastructure related to an authorised programme, see what runs on it and decide where to look first.',
    items: [
      {
        title: 'Start from the programme scope.',
        description:
          'Use the domains, IP addresses or other assets explicitly permitted by the programme. Stay within its published testing rules.',
      },
      {
        title: 'See what’s exposed.',
        description:
          'Explore observed services and technologies associated with the infrastructure you are authorised to assess.',
      },
      {
        title: 'Prioritise with context.',
        description:
          'Inspect host observations and use relevant technology and CVE associations as research leads rather than confirmed findings.',
      },
      {
        title: 'Stay in scope.',
        description:
          'Cross-check every lead against the programme rules before taking action. Search results are not an authorisation to test an unrelated system.',
      },
    ],
    next: linkTo('Compare plans', '/pricing', true),
  },
  '/use-cases/vulnerability-research': {
    title: 'See where a technology runs.',
    description:
      'Search for observed products and versions, explore the infrastructure around them and evaluate potential vulnerability context.',
    items: [
      {
        title: 'Search by product and version.',
        description:
          'Begin with a specific product or technology and use the supported search syntax to focus on relevant observations.',
      },
      {
        title: 'Explore the distribution.',
        description:
          'Review which internet-facing hosts appear to use the product, alongside observed ports and services.',
      },
      {
        title: 'Examine potential exposure.',
        description:
          'Investigate CVEs potentially associated with observed versions. Version matching is a research hint, not vulnerability confirmation.',
      },
      {
        title: 'Research responsibly.',
        description:
          'Consider vendor fixes, backports, system configuration and observation timing before drawing conclusions.',
      },
    ],
    next: linkTo('How CVE associations work', '/platform/data-methodology', true),
  },
  '/use-cases/osint-threat-investigation': {
    title: 'Turn one indicator into a clearer picture.',
    description:
      'Use observable technical attributes to investigate the internet-facing infrastructure behind a lead.',
    items: [
      {
        title: 'Start from what you have.',
        description:
          'An IP from a log, a domain from a report or a service identified in an alert can become a starting point.',
      },
      {
        title: 'Examine the host.',
        description:
          'Look at the available services, ports and detected technologies on the selected system.',
      },
      {
        title: 'Follow shared attributes.',
        description:
          'Use discovered attributes to formulate a new search. Do not assume a technical similarity proves common ownership or attribution.',
      },
      {
        title: 'Keep the evidence together.',
        description:
          'Record the observed attributes and their time context in your own investigation notes and analytical workflow.',
      },
    ],
    next: linkTo('Explore API integration', '/developers/api', true),
  },
} as const;
