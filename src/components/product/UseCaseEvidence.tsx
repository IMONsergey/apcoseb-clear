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
    title: "Visibility isn't permission.",
    introduction:
      'Follow one permitted starting point through candidate infrastructure to a responsible testing decision.',
    scenario: 'domain',
    start: 'example.com — a reserved stand-in for a domain explicitly permitted by a programme.',
    query: 'Search that permitted domain using the currently supported query format.',
    result: 'Inspect the host, ports and service context of candidate results.',
    next: 'Verify each selected host against the programme rules before interacting with it.',
    caveat:
      'The domain and host below are reserved examples, not a real bug bounty programme or an authorised target.',
  },
  technology: {
    label: 'VULNERABILITY RESEARCH / EXAMPLE INVESTIGATION',
    title: 'A version is a lead. Not a finding.',
    introduction:
      'Move from a technology observation to candidate hosts, then separate potential CVE associations from validated vulnerabilities.',
    scenario: 'technology',
    start: 'nginx 1.24.0, used here as a synthetic technology lead.',
    query:
      'Research input: nginx 1.24.0. Translate it into the supported product/version query syntax.',
    result: 'Compare observed host services, detection evidence and any associated CVE context.',
    next: 'Open a host, check observation age, patch backports and configuration before drawing conclusions.',
    caveat:
      'Technology, version and host information below are illustrative. No specific CVE or exploitable host is claimed.',
  },
  indicator: {
    label: 'OSINT / EXAMPLE INVESTIGATION',
    title: 'Follow attributes. Keep attribution separate.',
    introduction:
      'Take an indicator from an investigation, inspect its technical context and choose the next evidence-led query.',
    scenario: 'indicator',
    start: 'An IP address present in an alert or investigation report.',
    query: 'Look up the address in the current Apcosys search.',
    result: 'Review the host view, available services, technologies and observation date.',
    next: 'Investigate a relevant service or attribute while keeping attribution unproven.',
    caveat:
      '{address} is a reserved documentation address. This is a conceptual workflow, not an incident or attribution finding.',
    caveatValues: { address: '198.51.100.24' },
  },
};

function EvidenceJourney({ kind }: { kind: keyof typeof journeys }) {
  const { t } = useLocale();
  const item = journeys[kind];
  const stages = [
    [
      '01',
      'Starting point',
      kind === 'scope'
        ? 'An authorised domain.'
        : kind === 'technology'
          ? 'A product and version.'
          : 'An IP or domain from a report.',
    ],
    [
      '02',
      'Query',
      kind === 'scope'
        ? 'Find candidate infrastructure.'
        : kind === 'technology'
          ? 'Find matching observations.'
          : 'Look up the indicator.',
    ],
    [
      '03',
      'Result',
      kind === 'scope'
        ? 'Review exposed services.'
        : kind === 'technology'
          ? 'Read the detection evidence.'
          : 'Examine shared attributes.',
    ],
    [
      '04',
      'Next step',
      kind === 'scope'
        ? 'Confirm scope before testing.'
        : kind === 'technology'
          ? 'Validate applicability.'
          : 'Record a new research lead.',
    ],
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
          <a href={productUrl + '/search'}>
            <LocaleText>
              {t(
                kind === 'scope'
                  ? 'Search your scope'
                  : kind === 'technology'
                    ? 'Search by technology'
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
