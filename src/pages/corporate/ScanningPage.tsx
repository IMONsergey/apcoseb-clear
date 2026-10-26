import { Text } from '../../components/ui/Text';
import { linkTo } from '../../components/layout/pageLinks';
import { supportEmail } from '../../config/site';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection, ReadingRows } from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

export default function ScanningPage() {
  const { t } = useLocale();
  const inquiry =
    'mailto:' + supportEmail + '?subject=' + encodeURIComponent(t('Apcosys scanning inquiry'));
  const exclusion =
    'mailto:' +
    supportEmail +
    '?subject=' +
    encodeURIComponent(t('Apcosys network exclusion request')) +
    '&body=' +
    encodeURIComponent(
      [
        t('Networks / IP ranges:'),
        '',
        t('My role in managing these networks:'),
        '',
        t('Contact details:'),
        '',
        t('Relevant dates and context:'),
        '',
      ].join('\n'),
    );
  return (
    <PageFrame
      artwork="scanning"
      variant="technical"
      title="How Apcosys scans."
      description="The principles behind collecting observations from publicly accessible systems, and how to reach us about scanning activity or a network exclusion."
      sections={[
        { label: 'Collection', id: 'scanning-collection' },
        { label: 'Identify traffic', id: 'scanner-identity' },
        { label: 'Request exclusion', id: 'scanning-opt-out' },
      ]}
      heroLinks={[
        { label: 'Contact the scanning team', href: inquiry },
        { label: 'Request an exclusion', href: '#scanning-opt-out', secondary: true },
      ]}
      closing={{
        title: 'Questions about an observation?',
        description:
          'Share the relevant network and time context with the team. For help interpreting a result, start with Data & Methodology.',
      }}
      links={[
        { label: 'Email the scanning team', href: inquiry },
        linkTo('Data & Methodology', '/platform/data-methodology', true),
      ]}
    >
      <EditorialSection
        id="scanning-collection"
        media={{
          file: 'editorial/scope.webp',
          alt: 'A glass boundary defines the infrastructure reached through a controlled entry point.',
        }}
        title="What we collect."
        intro="Apcosys records how publicly accessible services respond to connection requests. Those responses become searchable technical observations."
      >
        <div className="scanning-records">
          <article>
            <Text as="h3">Ports and services</Text>
            <Text as="p">Where a service responds and which supported protocol is observed.</Text>
          </article>
          <article>
            <Text as="h3">Service responses</Text>
            <Text as="p">The technical response used as evidence for an observation.</Text>
          </article>
          <article>
            <Text as="h3">Detected technologies</Text>
            <Text as="p">Products and versions inferred from the available response.</Text>
          </article>
        </div>
        <Text as="p" className="editorial-note">
          For detailed collection boundaries or questions about specific traffic, contact the
          scanning team.
        </Text>
      </EditorialSection>
      <EditorialSection
        id="scanner-identity"
        title="Identifying our scanners."
        intro="If you believe traffic came from Apcosys, send the details needed to check its origin. A product name or service banner alone is not enough to verify a scanner."
      >
        <div className="scanning-request editorial-pair">
          <div>
            <Text as="h3">What to include</Text>
            <div className="scanning-request__fields">
              <dl className="scanning-checklist">
                <div>
                  <Text as="dt">Source</Text>
                  <Text as="dd">The source IP observed in your logs.</Text>
                </div>
                <div>
                  <Text as="dt">Destination</Text>
                  <Text as="dd">The affected address, port and protocol.</Text>
                </div>
                <div>
                  <Text as="dt">Time</Text>
                  <Text as="dd">The date, time and timezone of the traffic.</Text>
                </div>
                <div>
                  <Text as="dt">Context</Text>
                  <Text as="dd">A short description and a relevant, sanitised log excerpt.</Text>
                </div>
              </dl>
            </div>
          </div>
          <aside>
            <Text as="h3">Ask us to verify it.</Text>
            <div className="editorial-pair__body">
              <Text as="p">
                Write to the team with the source and destination details. We can review your
                question against the relevant scanning information.
              </Text>
              <Text as="p" className="scanning-request__privacy">
                Do not send passwords, API keys or unrelated customer data.
              </Text>
              <a className="stage-text-link" href={inquiry}>
                {t('Email {email}', { email: supportEmail })}
              </a>
            </div>
          </aside>
        </div>
      </EditorialSection>
      <EditorialSection
        id="scanning-opt-out"
        title="Opting out."
        intro="If you own or administer a network, contact us with the IP ranges you want excluded. Give the team enough context to identify the request and reach you."
      >
        <ReadingRows
          numbered
          items={[
            {
              title: 'Identify the networks.',
              text: 'List the relevant IP addresses or ranges. If the request concerns a particular event, include its date and timezone.',
            },
            {
              title: 'Explain your role.',
              text: 'Describe your responsibility for these networks and include a working contact address for follow-up.',
            },
            {
              title: 'Send the request.',
              text: 'Send your IP range and contact details. Our team will review the request.',
            },
          ]}
        />
        <a className="stage-text-link" href={exclusion}>
          {t('Prepare a network exclusion request')}
        </a>
      </EditorialSection>
    </PageFrame>
  );
}
