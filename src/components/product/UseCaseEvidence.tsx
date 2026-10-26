import { Text } from '../ui/Text';
import { CaseFragment } from './CompactFragments';
import type { EvidenceScenario } from './ProductEvidence';
import { productUrl } from '../../config/site';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

type Journey = {
  label: string;
  title: string;
  introduction: string;
  scenario: EvidenceScenario;
  start: string;
  query: string;
  result: string;
  next: string;
  caveat: string;
  caveatValues?: Record<string, string | number>;
};

const journeys: Record<'scope' | 'technology' | 'indicator', Journey> = {
  scope: {
    label: 'BUG BOUNTY / EXAMPLE INVESTIGATION',
    title: 'From a domain to an in-scope host.',
    introduction:
      'Build a shortlist of candidate hosts, then check their services, observation dates and programme scope.',
    scenario: 'domain',
    start: 'example.com stands in for a domain included in a programme scope.',
    query: 'Enter the permitted domain in the search field. This example uses example.com.',
    result: 'Compare portal.example.com and gateway.example.com in the example results.',
    next: 'Check each host against the programme scope before testing its services.',
    caveat: 'Reserved example domain and IP addresses.',
  },
  technology: {
    label: 'VULNERABILITY RESEARCH / EXAMPLE INVESTIGATION',
    title: 'From a product to the hosts running it.',
    introduction:
      'Identify candidate hosts with a matching technology, then use service evidence and observation dates to plan advisory checks.',
    scenario: 'technology',
    start: 'nginx is the product to look for; the example shows version 1.24.0.',
    query: 'Search for nginx, then inspect the detected version in each host record.',
    result: 'Read the HTTP Server header that supports the nginx version in this example.',
    next: 'Check the vendor advisory, installed patches and configuration.',
    caveat: 'Example technology and host records.',
  },
  indicator: {
    label: 'OSINT / EXAMPLE INVESTIGATION',
    title: 'From an IP address to its services.',
    introduction:
      'Turn an indicator into a next query, keeping the observed service, date and supporting response together.',
    scenario: 'indicator',
    start: '198.51.100.24 stands in for an IP address from an alert or report.',
    query: 'Enter the complete IP address in the search field.',
    result: 'The example connects the IP to portal.example.com and HTTPS on port 443.',
    next: 'Use the hostname or service as the next query, then check the new results.',
    caveat: '{address} · Reserved example address.',
    caveatValues: { address: '198.51.100.24' },
  },
};

function EvidenceJourney({ kind }: { kind: keyof typeof journeys }) {
  const { t } = useLocale();
  const item = journeys[kind];
  const stages = [
    ['01', 'Starting point', item.start],
    ['02', 'Query', item.query],
    ['03', 'Result', item.result],
    ['04', 'Next step', item.next],
  ] as const;
  return (
    <section
      id="example-investigation"
      className={'stage-case-evidence stage-case-evidence--' + kind + ' section-space'}
    >
      <div className="container">
        <div className="stage-case-evidence__heading">
          <Text as="h2">{item.title}</Text>
          <Text as="p">{item.introduction}</Text>
        </div>
        <div className="stage-case-experience">
          <div
            className="stage-example-journey"
            aria-label={t('Illustrative investigation stages')}
          >
            {stages.map(([number, title, description]) => (
              <div key={number}>
                {kind === 'scope' && (
                  <b className="stage-example-journey__number" aria-hidden="true">
                    {number}
                  </b>
                )}
                <span>
                  <LocaleText>{t(title)}</LocaleText>
                </span>
                <Text as="p">{description}</Text>
              </div>
            ))}
          </div>
          <CaseFragment kind={kind} />
        </div>
        <div className="stage-example-footer">
          <p>{t(item.caveat, item.caveatValues)}</p>
          <a href={productUrl + (kind === 'technology' ? '/search?search_value=nginx' : '/search')}>
            <LocaleText>
              {t(
                kind === 'scope'
                  ? 'Search your scope'
                  : kind === 'technology'
                    ? 'Search for nginx'
                    : 'Look up an IP or domain',
              )}
            </LocaleText>{' '}
          </a>
        </div>
      </div>
    </section>
  );
}

export function ScopeEvidence() {
  return <EvidenceJourney kind="scope" />;
}
export function TechnologyEvidence() {
  return <EvidenceJourney kind="technology" />;
}
export function IndicatorEvidence() {
  return <EvidenceJourney kind="indicator" />;
}
