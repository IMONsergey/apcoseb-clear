import { Text } from '../ui/Text';
import { useState, useRef, useEffect } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { productUrl } from '../../config/site';
import { siteHref } from '../../app/paths';
import { ProductEvidence, type EvidenceMode, type EvidenceScenario } from './ProductEvidence';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

type Story = 'search' | 'bounty' | 'vulnerability' | 'osint' | 'team';

const stories = {
  search: {
    tag: 'SEARCH & INVESTIGATION',
    heading: 'From query to technical context.',
    context:
      'Choose a step, select a host and inspect the evidence. The same record stays in view as the question becomes more specific.',
    query: 'example.com',
    captions: [
      'Enter an observed attribute',
      'Inspect matching infrastructure',
      'Examine a host',
      'Review detected technology',
      'Refine the next query',
    ],
    detail: [
      'Begin with an IP, domain, service or technology. Use supported attributes to narrow the results to the infrastructure behind your question.',
      'Compare open ports, services and detected technologies before opening a host. Look for the result that helps answer your question.',
      'Read the observed ports and services together with the response evidence. Keep detected products and versions in the context of that host.',
      'Check the evidence behind a detected version. A potential CVE association is a lead to validate against patches, configuration and observation time.',
      'Carry a useful service, technology or domain into the next query. Keep the observation that led you there so the investigation remains traceable.',
    ],
  },
  bounty: {
    tag: 'AUTHORISED BUG BOUNTY',
    heading: 'Stay inside the programme scope.',
    context:
      'Illustrative research using example.com, a reserved example domain. Always verify the actual programme scope before testing.',
    query: 'example.com',
    captions: [
      'Confirm scope',
      'Identify candidate hosts',
      'Inspect exposed services',
      'Prioritise research signals',
      'Verify authorisation again',
    ],
    detail: [
      'Start with a target explicitly permitted by programme rules.',
      'Treat search results as candidate infrastructure, not authorised targets.',
      'Review a host’s observed ports and software to prioritise manual verification.',
      'Versions and CVEs can guide investigation; neither proves exploitability.',
      'Confirm the scope and rules again before interacting with the host.',
    ],
  },
  vulnerability: {
    tag: 'VULNERABILITY RESEARCH',
    heading: 'Technology signals need verification.',
    context:
      'A conceptual product walkthrough: detected technology, matching hosts and potential vulnerability context.',
    query: 'nginx 1.24.0',
    captions: [
      'Choose a technology',
      'Review matching hosts',
      'Inspect an observed version',
      'Examine potential CVEs',
      'Validate findings responsibly',
    ],
    detail: [
      'Use a product or version only with syntax supported by the live search.',
      'Distribution is an observation, not a live census.',
      'Detected banners and versions can be incomplete or misleading.',
      'CVE associations do not account for all patches and configurations.',
      'Confirm applicability and follow coordinated disclosure practices.',
    ],
  },
  osint: {
    tag: 'OSINT & THREAT INVESTIGATION',
    heading: 'Follow an indicator, not an assumption.',
    context:
      'An illustrative lead built around documentation-only example addresses, without attribution claims.',
    query: '198.51.100.24',
    captions: [
      'Begin with an indicator',
      'Review observable hosts',
      'Inspect service evidence',
      'Assess shared attributes',
      'Record the next lead',
    ],
    detail: [
      'Start from a known IP or domain associated with a report or alert.',
      'Consider the age and completeness of each observation.',
      'Technical similarities are not proof of shared ownership.',
      'Use common services or technologies to formulate new questions.',
      'Keep evidence and timestamps in your own investigation records.',
    ],
  },
  team: {
    tag: 'SECURITY TEAM WORKFLOW',
    heading: 'From analyst question to technical context.',
    context:
      'An illustrative research experience for teams evaluating search and API capabilities.',
    query: '203.0.113.42',
    captions: [
      'Receive a question',
      'Search exposed hosts',
      'Review host context',
      'Assess a research signal',
      'Export the next task',
    ],
    detail: [
      'Turn an alert or investigation lead into a query.',
      'Narrow your view with the filters supported by your plan.',
      'Review the observation time along with technical results.',
      'Escalate only after validation; associations are not findings.',
      'Use confirmed API endpoints for workflow integrations.',
    ],
  },
} as const;

export function InvestigationWorkbench({ story = 'search' }: { story?: Story }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const data = stories[story];
  const [hostIndex, setHostIndex] = useState(() =>
    new URLSearchParams(window.location.search).get('demoHost') === '203.0.113.42' ? 1 : 0,
  );
  const stepsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = stepsRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const box = active.getBoundingClientRect();
    const frame = nav.getBoundingClientRect();
    if (box.left < frame.left) nav.scrollLeft -= frame.left - box.left;
    else if (box.right > frame.right) nav.scrollLeft += box.right - frame.right;
  }, [selected]);
  return (
    <section
      className={'stage-workbench stage-workbench--' + story + ' section-space'}
      id="investigation"
      aria-label={t('{name} interactive illustrated workflow', { name: t(data.tag) })}
    >
      <div className="container">
        <div className="stage-workbench__intro">
          <div>
            <Text as="h2">{data.heading}</Text>
          </div>
          <Text as="p">{data.context}</Text>
        </div>
        <div className="stage-workbench__stage">
          <nav
            ref={stepsRef}
            className="stage-workbench__steps"
            role="tablist"
            aria-label={t('Investigation workflow steps')}
          >
            {data.captions.map((label, index) => (
              <button
                key={label}
                type="button"
                id={'stage-step-' + story + '-' + index}
                className="stage-workbench__step"
                role="tab"
                aria-selected={selected === index}
                tabIndex={selected === index ? 0 : -1}
                onKeyDown={(event) => {
                  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? 4
                        : (index +
                            (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : 4)) %
                          5;
                  setSelected(next);
                  const nextButton = stepsRef.current
                    ?.querySelectorAll<HTMLButtonElement>('button')
                    .item(next);
                  nextButton?.focus({ preventScroll: true });
                }}
                aria-controls={'stage-panel-' + story}
                onClick={() => setSelected(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>
                  <LocaleText>{t(label)}</LocaleText>
                </strong>
              </button>
            ))}
          </nav>
          <div
            className="stage-workbench__viewer"
            role="tabpanel"
            tabIndex={0}
            id={'stage-panel-' + story}
            aria-labelledby={'stage-step-' + story + '-' + selected}
          >
            <div className="stage-workbench__record">
              <ProductEvidence
                compact
                embedded
                selectedHost={hostIndex}
                onSelectHost={setHostIndex}
                mode={
                  (['query', 'results', 'host', 'cve', 'continue'][selected] ??
                    'host') as EvidenceMode
                }
                scenario={(story === 'team' ? 'indicator' : 'domain') as EvidenceScenario}
              />
            </div>
            <MorphPanel>
              <div className="stage-workbench__insight" data-morph-enter>
                <div>
                  <Text as="h3">{data.captions[selected]}</Text>
                  <Text as="p">{data.detail[selected]}</Text>
                </div>
                <span className="stage-workbench__query" title={t('Example only')}>
                  {data.query}
                </span>
              </div>
            </MorphPanel>
          </div>
        </div>
        <div className="stage-workbench__bottom">
          <Text as="p">
            Illustrative UI · No live host results or backend queries are simulated. The product
            screens demonstrate the intended investigation sequence.
          </Text>
          <div>
            <a href={productUrl + '/search'}>
              <LocaleText>{t('Try Search')}</LocaleText>
            </a>
            <a href={siteHref('/platform/data-methodology')}>
              <LocaleText>{t('Data & Methodology')}</LocaleText>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
