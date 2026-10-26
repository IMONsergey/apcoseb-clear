import { Text } from '../../components/ui/Text';
import { plans } from '../../content/plans';
import { formatApiRate } from '../../lib/pricing';
import { linkTo } from '../../components/layout/pageLinks';
import { ApiExample } from '../../components/product/ApiExample';
import { apiDocumentationPath } from '../../config/site';
import { siteHref } from '../../app/paths';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection, FeatureColumns } from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

function ApiSample() {
  return (
    <EditorialSection
      id="documentation"
      title="Your first request."
      intro="Send a small host-search request to the public HTTP API. Use your account API key in the X-API-Key header."
      className="stage-api-demo"
    >
      <div className="api-first-request">
        <ol className="api-setup">
          <Text as="li">
            <Text as="h3">Get your account key.</Text>
            <Text as="p">
              Use an account with API access. Keep the key in your server environment or secrets
              manager, outside browser code.
            </Text>
          </Text>
          <Text as="li">
            <Text as="h3">Prepare a narrow request.</Text>
            <Text as="p">
              Send JSON to POST /api/v1/search/hosts. The example requests 20 hosts on page 1;
              docs_per_page supports up to 100 records.
            </Text>
          </Text>
          <Text as="li">
            <Text as="h3">Inspect the response.</Text>
            <Text as="p">
              Read total for the number of matches and hosts for this page of results. Keep each
              host's ports, protocols and update time with your research notes.
            </Text>
          </Text>
        </ol>
        <div>
          <ApiExample />
          <a className="stage-text-link" href={siteHref(apiDocumentationPath)}>
            <Text as="span">Read the full API reference</Text> →
          </a>
        </div>
      </div>
    </EditorialSection>
  );
}

export default function ApiPage() {
  const { t } = useLocale();
  return (
    <PageFrame
      artwork="api"
      variant="developer"
      title="Apcosys data, in your own code."
      description="Query hosts, services and technologies programmatically and use the results in scripts, pipelines, reports and internal tools."
      sections={[
        { label: 'First request', id: 'documentation' },
        { label: 'What to query', id: 'api-capabilities' },
        { label: 'Access & limits', id: 'api-access' },
      ]}
      closing={{
        title: 'Bring the evidence into your workflow.',
        description:
          'Start with the request example, compare API access and plan an integration around the fields your research needs.',
      }}
      links={[
        linkTo('View API Documentation', apiDocumentationPath),
        linkTo('Compare plans', '/pricing', true),
      ]}
    >
      <ApiSample />
      <EditorialSection
        id="api-capabilities"
        title="What you can query."
        intro="Search hosts, inspect individual systems and explore indexed storage records. Plus, Expert and Business include access to the public HTTP API."
      >
        <FeatureColumns
          items={[
            {
              title: 'Search infrastructure.',
              text: 'Find hosts by IP, domain, service or technology. Request analytics with the same filters to understand the matching set.',
              detail: 'POST /api/v1/search/hosts',
            },
            {
              title: 'Inspect a host.',
              text: 'Bring observed ports, services and detected products into the context of a single system.',
              detail: 'GET /api/v1/search/hosts/:ip',
            },
            {
              title: 'Explore buckets.',
              text: 'Search indexed storage records by host, extension or size. Review their file metadata and update time.',
              detail: 'POST /api/v1/search/buckets',
            },
          ]}
        />
      </EditorialSection>
      <EditorialSection
        id="api-access"
        title="API access by plan."
        intro="Plus, Expert and Business include API access. Choose a rate and allowance that fit the volume and pace of your workflow."
        className="stage-api-limits"
      >
        <div className="api-access-layout editorial-pair">
          <div className="api-plan-access">
            <Text as="h3" id="api-rate-limits-title">
              API rate limits
            </Text>
            <div
              role="region"
              aria-labelledby="api-rate-limits-title"
              tabIndex={0}
              className="stage-table-scroll"
            >
              <table className="stage-data-table stage-api-table">
                <thead>
                  <tr>
                    <th scope="col">{t('Plan')}</th>
                    <th scope="col">{t('API access')}</th>
                    <th scope="col">{t('Plan rate limit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <th scope="row">{t(plan.name[0] + plan.name.slice(1).toLowerCase())}</th>
                      <td>
                        <span className="api-access-status" data-available={plan.api}>
                          {t(plan.api ? 'Yes' : 'No')}
                        </span>
                      </td>
                      <td>{formatApiRate(plan, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <aside className="api-usage">
            <Text as="h3">Usage and credits.</Text>
            <div className="editorial-pair__body">
              <Text as="p">
                Request rate controls how quickly you can query. Your usage allowance controls how
                much capacity is available.
              </Text>
              <Text as="p">
                Each HTTP API method has a cost against the rate allowance. The usage guide shows
                these costs separately from plan credits and Search Token packages.
              </Text>
              <a className="stage-text-link" href={siteHref('/pricing') + '#usage-guide'}>
                {t('Understand usage and capacity')}
              </a>
              <Text as="p" className="editorial-note">
                Fields and values also depend on your plan. HTTP 402 identifies a restriction; HTTP
                429 identifies an exceeded request rate.
              </Text>
            </div>
          </aside>
        </div>
      </EditorialSection>
    </PageFrame>
  );
}
