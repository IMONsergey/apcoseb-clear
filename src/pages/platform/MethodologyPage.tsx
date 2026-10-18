import { Text } from '../../components/ui/Text';
import { primarySearch, linkTo } from '../../components/layout/pageLinks';
import { metrics } from '../../content/metrics';
import { EvidenceFlow } from '../../components/product/EvidenceFlow';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection, FeatureColumns } from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

const coverageDefinitions = [
  ['IPv4', 'Observed IPv4 address entries'],
  ['IPv6', 'Observed IPv6 address entries'],
  ['Domains', 'Domain observations connected to infrastructure'],
  ['Detected Products', 'Product detections derived from service responses'],
  ['CVE Associations', 'Potential links between detected products and CVEs'],
  ['Protocols', 'Protocols represented in the dataset'],
] as const;

export default function MethodologyPage() {
  const { t } = useLocale();
  return (
    <PageFrame
      artwork="methodology"
      variant="technical"
      title="Know what’s behind every result."
      description="How Apcosys collects internet infrastructure data, what each data type means, and how to read the context attached to an observation."
      sections={[
        { label: 'What we observe', id: 'observations' },
        { label: 'Coverage', id: 'coverage' },
        { label: 'Collection & dates', id: 'collection' },
        { label: 'Limits', id: 'data-limits' },
      ]}
      closing={{
        title: 'Read the result. Understand the source.',
        description:
          'Explore a host with its service evidence, or learn how to contact the team about scanning activity.',
      }}
      links={[primarySearch, linkTo('Responsible Scanning', '/responsible-scanning', true)]}
    >
      <EditorialSection
        id="observations"
        media={{
          file: 'editorial/evidence.webp',
          alt: 'A single teal connection links three transparent layers of observations.',
        }}
        title="What Apcosys records."
        intro="Apcosys turns responses from publicly accessible infrastructure into searchable observations. Three different kinds of information appear together in a result."
      >
        <EvidenceFlow />
        <div className="evidence-levels">
          {[
            [
              '01',
              'Observation',
              '443 / HTTPS',
              'A service responded on a port. Its response is the starting point for the record.',
            ],
            [
              '02',
              'Detection',
              'nginx / 1.24.0',
              'A product or version is inferred from the available service response.',
            ],
            [
              '03',
              'Association',
              'Potential CVE',
              'A detected product or version may connect to a published vulnerability advisory.',
            ],
          ].map(([n, title, value, text]) => (
            <article key={n}>
              <span>{n}</span>
              <Text as="h3">{title}</Text>
              <code>{t(value!)}</code>
              <Text as="p">{text}</Text>
            </article>
          ))}
        </div>
        <div className="evidence-reading">
          <Text as="p">
            <strong>Read from the observation outward.</strong>{' '}
            {t(
              'A response supports a detection; a detection can suggest an association. Each step needs its own interpretation.',
            )}
          </Text>
          <Text as="p">
            Domain observations connect names to infrastructure. A shared domain, service or
            technology does not by itself establish ownership.
          </Text>
        </div>
      </EditorialSection>
      <EditorialSection
        id="coverage"
        title="Coverage, defined."
        intro="These figures describe different parts of the dataset. Product detections and CVE associations are records, not counts of distinct vulnerable systems."
      >
        <div className="coverage-register" role="region" aria-label={t('Coverage metrics')}>
          {metrics.map((metric, i) => (
            <article key={metric.id}>
              <div>
                <Text as="h3">{metric.label}</Text>
                <Text as="p">{coverageDefinitions[i]?.[1]}</Text>
              </div>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
        <Text as="p" className="editorial-note">
          Client-preview figures. Measurement date and final counting definitions have not been
          supplied; these are not live totals.
        </Text>
      </EditorialSection>
      <EditorialSection
        id="collection"
        title="An observation has a time."
        intro="Internet-facing systems change. Read a service response alongside its collection context before using it in a decision."
      >
        <div className="collection-layout">
          <article>
            <Text as="h3">How collection works.</Text>
            <Text as="p">
              Apcosys discovers publicly accessible infrastructure and records responses across
              supported ports and protocols. Those responses provide the evidence for service and
              technology records.
            </Text>
            <a className="stage-text-link" href={linkTo('', '/responsible-scanning').href}>
              {t('Read the scanning principles')}
            </a>
          </article>
          <div className="date-reading">
            <Text as="h3">Reading dates and timestamps.</Text>
            <Text as="p">
              A recent record describes what responded at that moment. It does not guarantee that
              the service remains available or unchanged.
            </Text>
            <dl>
              <div>
                <Text as="dt">Before comparing records</Text>
                <Text as="dd">Check whether their observation times are comparable.</Text>
              </div>
              <div>
                <Text as="dt">Before acting on a result</Text>
                <Text as="dd">Validate the current state with an authorised method.</Text>
              </div>
            </dl>
            <Text as="p" className="editorial-note">
              The exact meanings of Created and Updated, and the scan cadence, still require
              confirmation.
            </Text>
          </div>
        </div>
      </EditorialSection>
      <EditorialSection
        id="data-limits"
        title="Know what the data cannot prove."
        intro="Searchable observations reduce uncertainty. They do not remove the need for technical judgement."
      >
        <FeatureColumns
          items={[
            {
              title: 'A match is not a finding.',
              text: 'CVE associations need checks against vendor advisories, patch backports and the actual configuration.',
            },
            {
              title: 'Missing is not absent.',
              text: 'Filtered hosts, unsupported ports and short-lived services may not appear in the dataset.',
            },
            {
              title: 'Similar is not related.',
              text: 'Shared technologies and service attributes are useful research leads, not proof of common ownership.',
            },
          ]}
        />
      </EditorialSection>
    </PageFrame>
  );
}
