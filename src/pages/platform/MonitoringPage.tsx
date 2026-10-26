import { Text } from '../../components/ui/Text';
import { LocaleText } from '../../i18n/LocaleText';
import { primaryContact, linkTo } from '../../components/layout/pageLinks';
import { MonitoringConcept } from '../../components/product/MonitoringConcept';
import { PageFrame } from '../../components/layout/PageFrame';
import {
  EditorialSection,
  ReadingRows,
  RelatedReading,
} from '../../components/layout/PageSections';

export default function MonitoringPage() {
  return (
    <PageFrame
      artwork="monitoring"
      variant="product"
      concept
      title="Understand what changes across your exposure."
      description="Compare infrastructure observations, review what changed and carry the relevant evidence into an investigation. Explore the proposed workflow below."
      sections={[
        { label: 'Explore the concept', id: 'monitoring-workflow' },
        { label: 'What a change means', id: 'change-signals' },
        { label: 'Next steps', id: 'monitoring-next' },
      ]}
      closing={{
        title: 'What would your team need to track?',
        description:
          'Tell us which assets, changes and investigation workflows matter to your team. Help shape the monitoring experience.',
      }}
      heroLinks={[
        { label: 'Explore the workflow', href: '#monitoring-workflow' },
        { ...primaryContact, secondary: true },
      ]}
      links={[
        primaryContact,
        linkTo('Explore Search & Investigation', '/platform/search-investigation', true),
      ]}
    >
      <MonitoringConcept />
      <EditorialSection
        id="change-signals"
        title="A change opens a question."
        intro="The useful part of a comparison is the next decision. Different changes need different checks before they become a research task."
      >
        <div className="change-ledger">
          {[
            [
              'New service',
              '443 → 443 + 22',
              'Expected access or new exposure?',
              'Check whether the added service belongs to a planned deployment. Review its response and confirm the host remains in your scope.',
            ],
            [
              'Different technology',
              'Version A → Version B',
              'Upgrade, reconfiguration or a different response?',
              'Compare the supporting service evidence. A different banner may reflect a configuration change rather than a software upgrade.',
            ],
            [
              'No later response',
              'Observed → Not observed',
              'Removed, filtered or temporarily unavailable?',
              'Check the observation time and collection context. An absent response alone does not prove that a service has been retired.',
            ],
          ].map(([title, change, question, text]) => (
            <article key={title}>
              <Text as="h3">{title}</Text>
              <code>
                <LocaleText>{change!}</LocaleText>
              </code>
              <Text as="h4">{question}</Text>
              <Text as="p">{text}</Text>
            </article>
          ))}
        </div>
      </EditorialSection>
      <EditorialSection
        id="monitoring-next"
        title="Keep the evidence with the task."
        intro="A useful handoff explains what changed, what was checked and what still needs an answer."
      >
        <ReadingRows
          numbered
          items={[
            {
              title: 'Define the scope.',
              text: 'Begin with infrastructure your team owns or is authorised to assess. Keep the scope and the research question explicit.',
            },
            {
              title: 'Review the comparison.',
              text: 'Keep the earlier and later records together with their time context. Inspect the service response behind the change.',
            },
            {
              title: 'Choose the next action.',
              text: 'Open the host for closer investigation, validate the observation or pass a concise question to another analyst.',
            },
          ]}
        />
        <RelatedReading
          items={[
            {
              title: 'Search & Investigation',
              text: 'Follow a changed host into its services and technical context.',
              path: '/platform/search-investigation',
            },
            {
              title: 'Data & Methodology',
              text: 'Understand observations, dates and the limits of a comparison.',
              path: '/platform/data-methodology',
            },
          ]}
        />
      </EditorialSection>
    </PageFrame>
  );
}
