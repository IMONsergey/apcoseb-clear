import { useEffect, useRef, useState, type ReactNode } from 'react';
import { siteHref } from '../app/paths';
import { Text } from '../components/ui/Text';
import { Icon } from '../components/ui/Icon';
import { plans, httpApiMethodCosts } from '../content/plans';
import { formatApiRate } from '../lib/pricing';
import { useLocale } from '../i18n/context';
import { useReadingPosition } from '../hooks/useReadingPosition';
import {
  apiBaseUrl,
  apiDocsNavigation,
  apiEndpoints,
  apiDocExamples,
  apiErrors,
  hostRequestFields,
  hostSearchResponseFields,
  hostSummaryFields,
  hostDetailFields,
  portFields,
  tlsFields,
  securityTxtFields,
  productFields,
  analyticsFields,
  bucketRequestFields,
  bucketResponseFields,
  bucketFields,
  bucketAnalyticsFields,
  filterFields,
  rangeFields,
  privateFields,
  restrictedFields,
  restrictedValues,
  valueSyntax,
  filterCatalogue,
  type ApiField,
} from '../content/api-documentation';
import './api-documentation.css';

function ApiDocsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="api-docs__section" tabIndex={-1}>
      <Text as="h2">{title}</Text>
      {children}
    </section>
  );
}

function FieldTable({ title, fields }: { title: string; fields: readonly ApiField[] }) {
  const { t } = useLocale();
  return (
    <table role="table" className="api-docs__table api-docs__fields">
      <caption>{title}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            {t('Field and type')}
          </th>
          <th role="columnheader" scope="col">
            {t('Meaning')}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {fields.map(({ name, type, description, defaultValue }) => (
          <tr role="row" key={name}>
            <th role="rowheader" scope="row">
              <code>{name}</code>
              <span className="api-docs__type">{type}</span>
              {defaultValue !== undefined && (
                <small>
                  {t('Default')}: <code>{defaultValue}</code>
                </small>
              )}
            </th>
            <td role="cell">
              <Text as="p">{description}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocCode({ label, code, example }: { label: string; code: string; example: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState('Copy');
  const pre = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current++;
      clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const current = ++version.current;
    clearTimeout(timer.current);
    let next = 'Copied';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      if (current !== version.current) return;
      const selection = window.getSelection();
      if (pre.current && selection) {
        const range = document.createRange();
        range.selectNodeContents(pre.current);
        selection.removeAllRanges();
        selection.addRange(range);
        next = 'Selected';
      } else next = 'Copy failed';
    }
    if (current !== version.current) return;
    setStatus(next);
    timer.current = setTimeout(() => setStatus('Copy'), 2200);
  };
  return (
    <div className="api-docs__code" data-example={example}>
      <div className="api-docs__code-heading">
        <span>{t(label)}</span>
        <button type="button" onClick={copy} aria-label={`${t(status)}: ${t(label)}`}>
          {t(status)}
        </button>
      </div>
      <pre ref={pre} tabIndex={0} aria-label={t(label)}>
        <code>{code}</code>
      </pre>
      <span className="sr-only" role="status">
        {status === 'Copy'
          ? ''
          : status === 'Selected'
            ? t('Clipboard unavailable. Code selected; use your device’s copy command.')
            : t(status)}
      </span>
    </div>
  );
}

function Method({ method, path }: { method: string; path: string }) {
  return (
    <p className="api-docs__method">
      <span>{method}</span>
      <code>{path}</code>
    </p>
  );
}

export default function ApiDocumentationPage() {
  const { t } = useLocale();
  const active = useReadingPosition(apiDocsNavigation.map(({ id }) => id));
  const contents = (
    <nav aria-label={t('On this page')}>
      <ol>
        {apiDocsNavigation.map((item) => (
          <li key={item.id} className={'nested' in item ? 'api-docs__nav-child' : undefined}>
            <a
              href={'#' + item.id}
              aria-current={active === item.id ? 'location' : undefined}
              onClick={(event) => {
                const disclosure = event.currentTarget.closest('details');
                if (disclosure) disclosure.open = false;
                document.getElementById(item.id)?.focus({ preventScroll: true });
              }}
            >
              {t(item.label)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
  return (
    <article className="api-docs">
      <header className="api-docs__header container">
        <a className="api-docs__back" href={siteHref('/developers/api')}>
          <Icon name="previous" /> {t('API overview')}
        </a>
        <Text as="h1">API documentation.</Text>
        <Text as="p">
          HTTP endpoints, filters, response fields and errors for Apcosys integrations.
        </Text>
        <div className="api-docs__base">
          <span>{t('Base URL')}</span>
          <code>{apiBaseUrl}</code>
        </div>
      </header>
      <div className="api-docs__layout container">
        <aside className="api-docs__sidebar">
          <p>{t('On this page')}</p>
          {contents}
        </aside>
        <div className="api-docs__reading">
          <details className="api-docs__mobile-nav">
            <summary>{t('On this page')}</summary>
            {contents}
          </details>
          <ApiDocsSection id="authentication" title="Connect to the API.">
            <Text as="p">
              Send your account API key in the X-API-Key header. Plus, Expert and Business include
              HTTP API access; Free does not.
            </Text>
            <Text as="p">
              Set APCOSYS_API_KEY in your server environment before using the cURL examples. Keep
              credentials outside browser code. Examples on this page are copied as text and are
              never executed here.
            </Text>
            <DocCode
              label="First host search"
              code={apiDocExamples.hosts}
              example="first-request"
            />
            <Text as="p" className="api-docs__note">
              Example responses use synthetic records and documentation addresses. Stored
              observations describe the collection time, not a live check of the host.
            </Text>
          </ApiDocsSection>

          <ApiDocsSection id="access-limits" title="Access and request limits.">
            <table className="api-docs__table">
              <caption>{t('API access by plan')}</caption>
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
                    <td>{t(plan.api ? 'Yes' : 'No')}</td>
                    <td>{formatApiRate(plan, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text as="p">
              Method costs count against the HTTP rate allowance: host search uses 1 unit, analytics
              3, bucket search 1 and bucket analytics 1. Other endpoints use 1 unit. These units do
              not define a conversion to plan credits or Search Tokens.
            </Text>
            <dl className="api-docs__costs">
              {Object.entries(httpApiMethodCosts).map(([method, cost]) => (
                <div key={method}>
                  <dt>
                    <code>{method === 'bucketAnalytics' ? 'bucket_analytics' : method}</code>
                  </dt>
                  <dd>{cost}</dd>
                </div>
              ))}
            </dl>
            <Text as="p">
              Field and value restrictions also apply inside filters and ranges. A restricted field
              or value returns HTTP 402. Exceeding the request rate returns HTTP 429.
            </Text>
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Restricted search fields')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Fields')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Minimum plan')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {restrictedFields.map(({ name, plan }) => (
                  <tr role="row" key={name}>
                    <th role="rowheader" scope="row">
                      <code>{name}</code>
                    </th>
                    <td role="cell">{t(plan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Restricted search values')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Values')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Minimum plan')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {restrictedValues.map(({ name, plan }) => (
                  <tr role="row" key={name}>
                    <th role="rowheader" scope="row">
                      <code>{name}</code>
                    </th>
                    <td role="cell">{t(plan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text as="p">
              Private search requires Business. Exposed-data values in detected-product records are
              returned only for Expert and Business.
            </Text>
            <a className="api-docs__link" href={siteHref('/pricing')}>
              {t('Compare plans')} →
            </a>
          </ApiDocsSection>

          <ApiDocsSection id="endpoints" title="Endpoint reference.">
            <Text as="p">
              Append these paths to the base URL. POST requests use a JSON body and Content-Type:
              application/json.
            </Text>
            <div className="api-docs__endpoint-list">
              {apiEndpoints.map(({ id, method, path, title }) => (
                <a href={'#' + id} key={method + path}>
                  <span>{method}</span>
                  <code>{path}</code>
                  <span>{t(title)}</span>
                </a>
              ))}
            </div>
          </ApiDocsSection>

          <ApiDocsSection id="search-hosts" title="Search hosts.">
            <Method method="POST" path="/search/hosts" />
            <Text as="p">
              Find host summaries with pagination and optional filters. A type filter selects ipv4,
              ipv6 or domain records; without it, all types are searched. Port, HTTP, TLS and
              product filters select the ports index automatically.
            </Text>
            <FieldTable
              title={t('Request body · all fields optional')}
              fields={hostRequestFields}
            />
            <FieldTable title={t('Search response')} fields={hostSearchResponseFields} />
            <FieldTable title={t('Host summary · hosts[]')} fields={hostSummaryFields} />
            <DocCode
              label="Example host-search response"
              code={apiDocExamples.hostsResponse}
              example="hosts-response"
            />
            <Text as="p">
              To continue, increase page and keep the same filters. Compare total with the records
              already returned. The first example requests 20 records; the documented default is 50.
            </Text>
          </ApiDocsSection>

          <ApiDocsSection id="host-details" title="Inspect one host.">
            <Method method="GET" path="/search/hosts/:ip" />
            <Text as="p">
              Set the ip path parameter to an IP address or domain. The response is one detailed
              host object. A missing record returns 404; an invalid host identifier returns 400.
            </Text>
            <DocCode label="Host lookup" code={apiDocExamples.host} example="host-details" />
            <FieldTable title={t('Host detail response')} fields={hostDetailFields} />
            <details className="api-docs__disclosure">
              <summary>
                <code>ports[]</code> — {t('Service fields')}
              </summary>
              <FieldTable title={t('Service fields')} fields={portFields} />
            </details>
            <details className="api-docs__disclosure">
              <summary>
                <code>ports[].tls_info</code> — {t('TLS and certificate fields')}
              </summary>
              <Text as="p">
                Certificate and handshake properties are directly inside tls_info. There is no
                nested certificate_info object.
              </Text>
              <FieldTable title={t('TLS and certificate fields')} fields={tlsFields} />
            </details>
            <details className="api-docs__disclosure">
              <summary>
                <code>ports[].security_txt</code>
              </summary>
              <FieldTable title={t('Security contact fields')} fields={securityTxtFields} />
            </details>
            <details className="api-docs__disclosure">
              <summary>
                <code>ports[].detected_products[]</code>
              </summary>
              <FieldTable title={t('Detected product fields')} fields={productFields} />
              <Text as="p">
                Each cve_list entry contains cve_id (string) and base_score (number). An associated
                CVE still needs validation against patches and configuration.
              </Text>
            </details>
          </ApiDocsSection>

          <ApiDocsSection id="analytics" title="Aggregate host results.">
            <Method method="POST" path="/search/analytics" />
            <Text as="p">
              Use the same search filters as host search to request facets. The type filter controls
              the same IPv4, IPv6 and domain scope.
            </Text>
            <DocCode
              label="Host analytics request"
              code={apiDocExamples.analytics}
              example="analytics"
            />
            <FieldTable title={t('Analytics response')} fields={analyticsFields} />
            <Text as="p">
              Facet names include type, port, status_code, org, country_name, protocol, products,
              title, cve_id, vendors, labels and redirects.
            </Text>
            <DocCode
              label="Example analytics response"
              code={apiDocExamples.analyticsResponse}
              example="analytics-response"
            />
          </ApiDocsSection>

          <ApiDocsSection id="search-buckets" title="Search storage records.">
            <Method method="POST" path="/search/buckets" />
            <Text as="p">
              Search indexed bucket records by host, file metadata, size and time. Bucket sorting
              supports the fields below; it differs from host-search sorting.
            </Text>
            <DocCode
              label="Bucket search request"
              code={apiDocExamples.buckets}
              example="buckets"
            />
            <FieldTable title={t('Bucket request fields')} fields={bucketRequestFields} />
            <FieldTable title={t('Bucket response')} fields={bucketResponseFields} />
            <FieldTable title={t('Storage record · result[]')} fields={bucketFields} />
          </ApiDocsSection>

          <ApiDocsSection id="bucket-analytics" title="Aggregate bucket results.">
            <Method method="POST" path="/search/buckets/analytics" />
            <Text as="p">
              Send the same request fields as bucket search. The response groups file counts by
              storage host.
            </Text>
            <DocCode
              label="Bucket analytics request"
              code={apiDocExamples.bucketAnalytics}
              example="bucket-analytics"
            />
            <FieldTable title={t('Bucket analytics response')} fields={bucketAnalyticsFields} />
          </ApiDocsSection>

          <ApiDocsSection id="private-search" title="Query private scan data.">
            <Text as="p">
              Business accounts can query their own private scan data with the three methods below.
              Their public equivalents define the request and response shapes. The private dataset
              is selected automatically; a type filter is not required.
            </Text>
            {apiEndpoints
              .filter(({ id }) => id === 'private-search')
              .map(({ method, path }) => (
                <Method key={path} method={method} path={path} />
              ))}
            <FieldTable title={t('Additional private-search field')} fields={privateFields} />
            <DocCode
              label="Private host search"
              code={apiDocExamples.privateHosts}
              example="private-hosts"
            />
            <DocCode
              label="Private host lookup"
              code={apiDocExamples.privateHost}
              example="private-host"
            />
            <DocCode
              label="Private analytics request"
              code={apiDocExamples.privateAnalytics}
              example="private-analytics"
            />
          </ApiDocsSection>

          <ApiDocsSection id="filters" title="Filter syntax and field names.">
            <FieldTable title={t('Filter item · simple_search_filters[]')} fields={filterFields} />
            <Text as="p">
              Leaf filters specify a field and a non-empty value. Group filters contain nested
              filters with AND, OR or NOT. AND is the default operator.
            </Text>
            <DocCode
              label="Nested filter example"
              code={apiDocExamples.nested}
              example="nested-filters"
            />
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Value syntax')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Example')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Meaning')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {valueSyntax.map(({ name, description }) => (
                  <tr role="row" key={name}>
                    <th role="rowheader" scope="row">
                      <code>{name}</code>
                    </th>
                    <td role="cell">
                      <Text as="p">{description}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <FieldTable title={t('Range item · range_filter[]')} fields={rangeFields} />
            <Text as="p">
              {
                'Use headers.k for a header name, headers.v for a value, or headers.Server to match a specific header and value together. The header.{Name} alias is also supported.'
              }
            </Text>
            <DocCode
              label="HTTP header filter"
              code={apiDocExamples.header}
              example="header-filter"
            />
            <Text as="p">
              security_body searches security.txt content and may be a top-level field or a filter
              field. It requires Business. Time filters use Unix seconds.
            </Text>
            {filterCatalogue.map(({ title, fields }) => (
              <table role="table" className="api-docs__table api-docs__fields" key={title}>
                <caption>{t(title)}</caption>
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader" scope="col">
                      {t('Field and type')}
                    </th>
                    <th role="columnheader" scope="col">
                      {t('Values or format')}
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {fields.map(([name, type, example]) => (
                    <tr role="row" key={name}>
                      <th role="rowheader" scope="row">
                        <code>{name}</code>
                        <span className="api-docs__type">{type}</span>
                      </th>
                      <td role="cell">
                        <code>{example}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
            <Text as="p" className="api-docs__note">
              redirect_paths is accepted as an alias for redirects. To search across service fields,
              use the full_text_search request field.
            </Text>
          </ApiDocsSection>

          <ApiDocsSection id="errors" title="Handle API errors.">
            <Text as="p">
              Errors return a JSON object with an error string. Read that message together with the
              HTTP status.
            </Text>
            <DocCode label="Example error response" code={apiDocExamples.error} example="error" />
            <table className="api-docs__table api-docs__errors">
              <caption>{t('HTTP status codes')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Status')}</th>
                  <th scope="col">{t('Meaning and next step')}</th>
                </tr>
              </thead>
              <tbody>
                {apiErrors.map(({ code, title, description }) => (
                  <tr key={code}>
                    <th scope="row">
                      <code>{code}</code>
                    </th>
                    <td>
                      <strong>{t(title)}</strong>
                      <Text as="p">{description}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ApiDocsSection>

          <ApiDocsSection id="best-practices" title="Build an integration you can inspect.">
            <ul className="api-docs__guidance">
              <Text as="li">
                Keep API keys in your server environment and handle 401, 402 and 429 explicitly.
              </Text>
              <Text as="li">
                Start with a small page and paginate through the results. Preserve the returned
                identifiers, service evidence and observation timestamps.
              </Text>
              <Text as="li">
                Use current filter names: products, vendors, cve_id, headers and security_body.
                Check field restrictions before expanding a query.
              </Text>
              <Text as="li">
                Treat product and CVE associations as research context. Confirm applicability before
                reporting a vulnerability.
              </Text>
            </ul>
            <Text as="p">
              The published reference lists a Postman collection and further examples in the Apcosys
              dashboard.
            </Text>
            <div className="api-docs__closing">
              <a href={siteHref('/developers/api')}>
                {t('API overview')} <Icon name="arrow" />
              </a>
              <a href={siteHref('/contact?topic=API%20access')}>
                {t('Talk to Us')} <Icon name="arrow" />
              </a>
            </div>
          </ApiDocsSection>
        </div>
      </div>
    </article>
  );
}
