import { Text } from '../../components/ui/Text';
import { primarySearch, linkTo } from '../../components/layout/pageLinks';
import { InvestigationWorkbench } from '../../components/product/InvestigationWorkbench';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection, ReadingRows } from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

export default function InvestigationPage() {
  const { t } = useLocale();
  return (
    <PageFrame
      artwork="search"
      variant="product"
      title="Every investigation starts with a question."
      description="Turn a technical question into a query, review the hosts that match and open each one to see the services, technologies and context behind it."
      sections={[
        { label: 'The investigation', id: 'investigation' },
        { label: 'Starting a query', id: 'search-syntax' },
        { label: 'Reading the evidence', id: 'research-context' },
      ]}
      closing={{
        title: 'Keep the thread.',
        description:
          'Use a service, a technology or a domain from one result to ask a more precise question. Start with the public search and follow what you find.',
      }}
      links={[primarySearch, linkTo('Data & Methodology', '/platform/data-methodology', true)]}
    >
      <InvestigationWorkbench story="search" />
      <EditorialSection
        id="search-syntax"
        title="Query with what you already know."
        intro="You do not need a complete picture to begin. Choose the attribute you have, then use the current search filters to narrow the question."
      >
        <div className="query-guide">
          {[
            [
              'IP address',
              '198.51.100.24',
              'Investigate one host.',
              'Useful when a log, alert or report already identifies a system. Review its observed services before widening the search.',
            ],
            [
              'Domain',
              'example.com',
              'Find the infrastructure behind a name.',
              'Use an authorised domain as a starting point, then inspect the hosts and services returned by the search.',
            ],
            [
              'Technology',
              'nginx 1.24.0',
              'Research a product or version.',
              'Look for matching detections, compare the services involved and inspect the evidence behind a version match.',
            ],
          ].map(([label, value, title, text]) => (
            <article key={label}>
              <span>{t(label!)}</span>
              <code>{value}</code>
              <Text as="h3">{title}</Text>
              <Text as="p">{text}</Text>
            </article>
          ))}
        </div>
        <Text as="p" className="editorial-note">
          Illustrative inputs, not query syntax. Use the syntax and filters provided in Apcosys
          search.
        </Text>
      </EditorialSection>
      <EditorialSection
        id="research-context"
        title="Context, not conclusions."
        intro="A result helps you decide where to look next. The evidence behind it determines what you can reasonably conclude."
      >
        <ReadingRows
          items={[
            {
              title: 'Judge relevance before you click.',
              text: 'Compare open ports, services and detected technologies across the results. Narrow the list to systems that help answer your question.',
              detail:
                'Look for: the service you expected, an unexpected exposed port, or a product worth investigating.',
            },
            {
              title: 'One host, the technical picture.',
              text: 'Open a host to read its observed services together. A port identifies where a response was collected; the response provides context for a product or version detection.',
              detail: 'Keep the host, port and supporting response together when recording a lead.',
            },
            {
              title: 'Validate a potential association.',
              text: 'A CVE associated with a detected version points to possible exposure. Backported patches, configuration and the age of an observation can change whether it applies.',
              detail: 'An association is a lead to verify, not a confirmed vulnerability.',
            },
          ]}
        />
      </EditorialSection>
    </PageFrame>
  );
}
