import { apiDocumentationPath } from '../config/site';
import type { SitePath } from './routes';

type NavigationGroup = {
  label: string;
  items: readonly { label: string; href: SitePath }[];
};
type FooterGroup = {
  title: string;
  links: readonly (readonly [label: string, path: SitePath])[];
};

export const navigation = [
  {
    label: 'Platform',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Search & Investigation', href: '/platform/search-investigation' },
      { label: 'Data & Methodology', href: '/platform/data-methodology' },
      { label: 'Monitoring concept', href: '/platform/monitoring' },
      { label: 'Responsible Scanning', href: '/responsible-scanning' },
      { label: 'For Investors', href: '/docs/investors' },
      { label: 'Talk to Us', href: '/contact' },
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
      { label: 'Documentation', href: apiDocumentationPath },
    ],
  },
] as const satisfies readonly NavigationGroup[];

export const footerGroups = [
  {
    title: 'Platform',
    links: [
      ['Search & Investigation', '/platform/search-investigation'],
      ['Data & Methodology', '/platform/data-methodology'],
      ['Monitoring concept', '/platform/monitoring'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    title: 'Use Cases',
    links: [
      ['Bug Bounty', '/use-cases/bug-bounty'],
      ['Vulnerability Research', '/use-cases/vulnerability-research'],
      ['OSINT', '/use-cases/osint-threat-investigation'],
    ],
  },
  { title: 'For Teams', links: [['Security Teams', '/teams']] },
  {
    title: 'Developers',
    links: [
      ['API', '/developers/api'],
      ['Documentation', apiDocumentationPath],
    ],
  },
  {
    title: 'APCOSYS',
    links: [
      ['About', '/about'],
      ['For Investors', '/docs/investors'],
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
] as const satisfies readonly FooterGroup[];
