import { caseStudies } from './caseStudies';
import { productUrl } from '../../config/site';
import { PageFrame } from '../../components/layout/PageFrame';
import { CaseApproach, CaseChecks } from './CaseGuidance';
import {
  ScopeEvidence,
  TechnologyEvidence,
  IndicatorEvidence,
} from '../../components/product/UseCaseEvidence';

export default function UseCasePage({ path }: { path: string }) {
  const config = caseStudies[path as keyof typeof caseStudies];
  if (!config) return null;
  const kind =
    path === '/use-cases/bug-bounty'
      ? 'scope'
      : path === '/use-cases/vulnerability-research'
        ? 'technology'
        : 'indicator';
  return (
    <PageFrame
      variant="usecase"
      artwork={
        path === '/use-cases/bug-bounty'
          ? 'bounty'
          : path === '/use-cases/vulnerability-research'
            ? 'vulnerability'
            : 'osint'
      }
      title={config.title}
      description={config.description}
      sections={[
        { label: 'The approach', id: 'research-approach' },
        { label: 'Example investigation', id: 'example-investigation' },
        { label: 'Before you act', id: 'research-checks' },
      ]}
      closing={{
        title:
          kind === 'scope'
            ? 'Find your next in-scope lead.'
            : kind === 'technology'
              ? 'Put a technology under the microscope.'
              : 'Follow the next evidence-led question.',
        description:
          kind === 'scope'
            ? 'Start free. Upgrade when your research needs more credits, filters or API access.'
            : kind === 'technology'
              ? 'Search observed products and versions. The plan comparison lists CVE context from Plus.'
              : 'Start with an IP or domain, or use the API to bring repeat lookups into your investigation workflow.',
      }}
      links={[
        {
          label:
            path === '/use-cases/bug-bounty'
              ? 'Search your scope'
              : path === '/use-cases/vulnerability-research'
                ? 'Search for nginx'
                : 'Look up an IP or domain',
          href: productUrl + (kind === 'technology' ? '/search?search_value=nginx' : '/search'),
        },
        config.next,
      ]}
    >
      <CaseApproach kind={kind} items={config.items} />
      {path === '/use-cases/bug-bounty' ? (
        <ScopeEvidence />
      ) : path === '/use-cases/vulnerability-research' ? (
        <TechnologyEvidence />
      ) : (
        <IndicatorEvidence />
      )}
      <CaseChecks kind={kind} />
    </PageFrame>
  );
}
