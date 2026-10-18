import { Text } from '../../components/ui/Text';
import {
  EditorialSection,
  FeatureColumns,
  ReadingRows,
} from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

type GuidanceItem = { title: string; description: string };
export type CaseKind = 'scope' | 'technology' | 'indicator';
export function CaseApproach({ kind, items }: { kind: CaseKind; items: readonly GuidanceItem[] }) {
  const { t } = useLocale();
  if (kind === 'scope')
    return (
      <EditorialSection
        id="research-approach"
        title="Make scope the starting point."
        intro="The useful result is a host you can responsibly investigate. Keep the programme’s boundaries with you from the first query to the last check."
      >
        <ReadingRows
          numbered
          items={items.map((item) => ({ title: item.title, text: item.description }))}
        />
      </EditorialSection>
    );
  if (kind === 'technology')
    return (
      <EditorialSection
        id="research-approach"
        title="Move from detection to evidence."
        intro="Research a technology across infrastructure, then inspect individual hosts to understand whether a potential exposure is relevant."
      >
        <div className="research-pairs">
          {items.map((item, i) => (
            <article key={item.title}>
              <Text as="h3">
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {item.title}
              </Text>
              <Text as="p">{item.description}</Text>
            </article>
          ))}
        </div>
      </EditorialSection>
    );
  return (
    <EditorialSection
      id="research-approach"
      title="Make the next question more precise."
      intro="Start with the indicator you have. Separate what you observed from what you think it might mean as the investigation develops."
    >
      <div className="indicator-approach">
        <div>
          {items.map((item) => (
            <article key={item.title}>
              <Text as="h3">{item.title}</Text>
              <Text as="p">{item.description}</Text>
            </article>
          ))}
        </div>
        <aside className="investigation-notebook" aria-label={t('Example investigation note')}>
          <Text as="h3">Keep a useful investigation note.</Text>
          <dl>
            <div>
              <Text as="dt">Starting indicator</Text>
              <Text as="dd">
                <code>198.51.100.24</code>
                <span>Reserved example address</span>
              </Text>
            </div>
            <div>
              <Text as="dt">Observed</Text>
              <Text as="dd">An HTTPS service and a technology response.</Text>
            </div>
            <div>
              <Text as="dt">Open question</Text>
              <Text as="dd">Which other observations could explain this service?</Text>
            </div>
            <div>
              <Text as="dt">Next query</Text>
              <Text as="dd">A relevant service or technology from the host.</Text>
            </div>
            <div>
              <Text as="dt">Keep separate</Text>
              <Text as="dd">Ownership and attribution remain unproven.</Text>
            </div>
          </dl>
        </aside>
      </div>
    </EditorialSection>
  );
}

const checks = {
  scope: {
    title: 'Before a candidate becomes a target.',
    intro:
      'A search result helps prioritise research. The programme’s rules determine whether and how you can test it.',
    items: [
      {
        title: 'Ownership',
        text: 'Confirm the individual host is covered. A related domain or shared technology does not automatically extend the scope.',
      },
      {
        title: 'Testing rules',
        text: 'Check permitted techniques, exclusions and rate restrictions in the programme before interacting with a service.',
      },
      {
        title: 'A reproducible lead',
        text: 'Keep the host, port and response that prompted your question. Validate it before writing a finding.',
      },
    ],
  },
  technology: {
    title: 'Three checks after a version match.',
    intro: 'The strongest research starts where a simple version comparison stops.',
    items: [
      {
        title: 'Detection evidence',
        text: 'Read the response behind the product label. Banners can be incomplete, stale or changed by intermediaries.',
      },
      {
        title: 'Advisory applicability',
        text: 'Check the affected versions, required configuration and vendor guidance. Account for backported patches.',
      },
      {
        title: 'Current state',
        text: 'Consider when the service was observed. Verify the condition on systems you are authorised to assess.',
      },
    ],
  },
  indicator: {
    title: 'Build an evidence trail you can revisit.',
    intro:
      'A useful note lets another analyst retrace the question without inheriting an unsupported conclusion.',
    items: [
      {
        title: 'Keep the source',
        text: 'Record where the indicator came from and which question it was meant to answer.',
      },
      {
        title: 'Keep the context',
        text: 'Carry the host, service evidence and available observation time into your notes or reporting workflow.',
      },
      {
        title: 'Keep the uncertainty',
        text: 'Distinguish observed attributes, hypotheses and unanswered questions. Shared infrastructure is not attribution.',
      },
    ],
  },
} as const;
export function CaseChecks({ kind }: { kind: CaseKind }) {
  const content = checks[kind];
  return (
    <EditorialSection id="research-checks" title={content.title} intro={content.intro}>
      <FeatureColumns items={content.items} />
    </EditorialSection>
  );
}
