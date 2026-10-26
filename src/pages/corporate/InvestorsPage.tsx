import { Text } from '../../components/ui/Text';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection, ReadingRows } from '../../components/layout/PageSections';
import { linkTo } from '../../components/layout/pageLinks';

const investorContact = { label: 'rk@apcosys.net', href: 'mailto:rk@apcosys.net' };

export default function InvestorsPage() {
  return (
    <PageFrame
      artwork="investors"
      title="For investors."
      description="External digital exposure intelligence. Apcosys turns observations of public internet infrastructure into searchable context for security researchers and teams."
      heroLinks={[
        { ...investorContact, label: 'Investor enquiries' },
        linkTo('Explore the platform', '/platform/search-investigation', true),
      ]}
      sections={[
        { label: 'The opportunity', id: 'investor-opportunity' },
        { label: 'Platform foundations', id: 'investor-platform' },
        { label: 'The next stage', id: 'investor-growth' },
      ]}
      closing={{
        title: 'Start a conversation.',
        description:
          'For investment enquiries and further company information, contact the Apcosys team directly.',
      }}
      links={[investorContact, linkTo('About', '/about', true)]}
    >
      <EditorialSection
        id="investor-opportunity"
        title="Visibility beyond the perimeter."
        intro="Cloud adoption and distributed infrastructure keep expanding what organisations expose to the public internet."
      >
        <div className="about-statement">
          <Text as="p">
            Exposed services, infrastructure misconfigurations and data leaks create risks that are
            difficult to understand from inside an organisation alone. Security teams need an
            external view of the systems they investigate.
          </Text>
          <Text as="p">
            Apcosys observes publicly accessible infrastructure directly. It brings hosts, services
            and technologies into a searchable view, helping teams move from a technical signal to
            the context behind it.
          </Text>
        </div>
      </EditorialSection>
      <EditorialSection
        id="investor-platform"
        title="A platform built around observations."
        intro="The foundation is the connection between internet-scale collection, useful technical context and the workflows that put it to work."
      >
        <ReadingRows
          numbered
          items={[
            {
              title: 'Internet-wide perspective.',
              text: 'Observe publicly accessible hosts and services across networks, rather than relying only on information collected inside a customer environment.',
            },
            {
              title: 'Application-layer context.',
              text: 'Connect services, detected technologies and response details so researchers can understand what sits behind an exposed host.',
            },
            {
              title: 'An investigation workflow.',
              text: 'Move from a query to matching hosts and technical evidence. Refine the search as each observation raises the next question.',
            },
            {
              title: 'Data that teams can use.',
              text: 'Bring infrastructure intelligence into research, security operations and internal tools through search and API access.',
            },
          ]}
        />
      </EditorialSection>
      <EditorialSection
        id="investor-growth"
        title="Building the next stage of Apcosys."
        intro="Our focus is continued platform development and market expansion."
      >
        <div className="about-statement">
          <Text as="p">
            We are developing the platform around the needs of security researchers and enterprise
            teams: richer infrastructure context, practical workflows and scalable access to data.
          </Text>
          <Text as="p">
            We welcome conversations with investors who share a long-term interest in internet
            intelligence and external digital exposure. Get in touch to discuss the company, our
            direction and the next stage of growth.
          </Text>
        </div>
      </EditorialSection>
    </PageFrame>
  );
}
