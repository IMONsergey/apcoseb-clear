import { apiDocumentationUrl } from '../config/site';

/** Use the on-site guide until the product owner supplies the API reference. */
const documentationHref = apiDocumentationUrl ?? '/developers/api#documentation';

export const navigation = [
  {
    label: 'Platform',
    items: [
      { label: 'Search & Investigation', href: '/platform/search-investigation' },
      { label: 'Data & Methodology', href: '/platform/data-methodology' },
      { label: 'Monitoring', href: '/platform/monitoring' },
    ],
  },
  {
    label: 'Use Cases',
    items: [
      { label: 'Bug Bounty', href: '/use-cases/bug-bounty' },
      { label: 'Vulnerability Research', href: '/use-cases/vulnerability-research' },
      { label: 'OSINT & Threat Investigation', href: '/use-cases/osint-threat-investigation' },
    ],
  },
  {
    label: 'Developers',
    items: [
      { label: 'API', href: '/developers/api' },
      { label: 'Documentation', href: documentationHref },
    ],
  },
] as const;
export const footerGroups = [
  {
    title: 'Platform',
    links: [
      ['Search & Investigation', '/platform/search-investigation'],
      ['Data & Methodology', '/platform/data-methodology'],
      ['Monitoring', '/platform/monitoring'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    title: 'Use Cases',
    links: [
      ['Bug Bounty', '/use-cases/bug-bounty'],
      ['Vulnerability Research', '/use-cases/vulnerability-research'],
      ['OSINT & Threat Investigation', '/use-cases/osint-threat-investigation'],
    ],
  },
  { title: 'For Teams', links: [['Security Teams', '/teams']] },
  {
    title: 'Developers',
    links: [
      ['API', '/developers/api'],
      ['Documentation', documentationHref],
    ],
  },
  {
    title: 'APCOSYS',
    links: [
      ['About', '/about'],
      ['Responsible Scanning', '/responsible-scanning'],
      ['Talk to Us', '/contact'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['API & Data License Agreement', '/legal/api-data-license-agreement'],
      ['Cookie Policy', '/legal/cookie-policy'],
      ['Data Collection Policy', '/legal/data-collection-policy'],
      ['Data Processing Agreement', '/legal/data-processing-agreement'],
      ['Privacy Policy', '/legal/privacy-policy'],
      ['Terms & Conditions', '/legal/terms'],
    ],
  },
] as const;
