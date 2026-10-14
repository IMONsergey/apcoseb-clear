import { Text } from '../../components/ui/Text';
import { primaryContact, linkTo } from '../../components/layout/pageLinks';
import { supportEmail } from '../../config/site';
import { PageFrame } from '../../components/layout/PageFrame';
import {
  EditorialSection,
  ReadingRows,
  RelatedReading,
} from '../../components/layout/PageSections';

export default function AboutPage() {
  return (
    <PageFrame
      artwork="about"
      variant="editorial"
      title="Built for people who investigate the internet."
      description="Apcosys makes technical observations about internet-facing infrastructure searchable, so security researchers and teams can investigate them."
      sections={[
        { label: 'Why Apcosys', id: 'why-apcosys' },
        { label: 'Our approach', id: 'our-approach' },
        { label: 'Explore the platform', id: 'about-explore' },
      ]}
      closing={{
        title: 'Talk to the people behind the product.',
        description: `Questions about the platform, data or collaboration? Reach the team at ${supportEmail}.`,
      }}
      links={[primaryContact, linkTo('Responsible Scanning', '/responsible-scanning', true)]}
    >
      <EditorialSection
        id="why-apcosys"
        media={{
          file: 'editorial/investigation.webp',
          alt: 'A glass lens brings one connected host into focus within an infrastructure landscape.',
        }}
        title="Why we built Apcosys."
        intro="The answer is rarely in the first result. A good investigation needs a clear path from a technical question to the evidence behind it."
      >
        <div className="about-statement">
          <Text as="p">
            Internet infrastructure produces a large volume of technical signals. The difficult part
            is turning an initial lead into a question you can investigate.
          </Text>
          <Text as="p">
            Apcosys brings hosts, services and detected technologies into a searchable view, so
            researchers can open a result, understand its context and choose where to look next.
          </Text>
        </div>
        <ol className="about-path">
          <Text as="li">
            <strong>Query</strong>
            <span>Start with an attribute.</span>
          </Text>
          <Text as="li">
            <strong>Host</strong>
            <span>Inspect the services.</span>
          </Text>
          <Text as="li">
            <strong>Context</strong>
            <span>Read the evidence.</span>
          </Text>
          <Text as="li">
            <strong>Next question</strong>
            <span>Continue the investigation.</span>
          </Text>
        </ol>
      </EditorialSection>
      <EditorialSection
        id="our-approach"
        title="Our approach."
        intro="Make the evidence easier to find, easier to understand and easier to use responsibly."
      >
        <ReadingRows
          items={[
            {
              title: 'Searchable observations.',
              text: 'We turn how public hosts respond — ports, services and technologies — into data you can query. Start with an attribute you know and narrow the question as you learn.',
            },
            {
              title: 'Built for investigation.',
              text: 'The product follows the path from query to host to context. Each step should help a researcher decide what deserves a closer look.',
            },
            {
              title: 'Transparent data.',
              text: 'A useful result explains what was observed and what remains uncertain. Collection context, observation dates and detection limits matter as much as the result itself.',
            },
            {
              title: 'Responsible collection.',
              text: 'Publicly observable information is not permission to test a system. We provide a direct contact route for scanning questions and network exclusion requests.',
            },
          ]}
        />
      </EditorialSection>
      <EditorialSection
        id="about-explore"
        title="See the approach in practice."
        intro="Explore the investigation workflow and the principles behind the data."
      >
        <RelatedReading
          items={[
            {
              title: 'From a question to a host.',
              text: 'Follow a query through results, services and technical context.',
              path: '/platform/search-investigation',
            },
            {
              title: 'What sits behind a result.',
              text: 'Read about observations, coverage, dates and potential CVE associations.',
              path: '/platform/data-methodology',
            },
          ]}
        />
      </EditorialSection>
    </PageFrame>
  );
}
