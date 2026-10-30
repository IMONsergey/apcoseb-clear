import { useEffect, useRef, useState, type ReactNode } from 'react';
import { siteHref } from '../app/paths';
import { Text } from '../components/ui/Text';
import { Icon } from '../components/ui/Icon';
import { apiSpecUrl } from '../config/site';
import type { PublicApiDocumentResult } from '../lib/public-api-loader';
import { publicApiSpecTimeoutMs } from '../lib/public-api-policy';
import type { ApiField } from '../lib/public-api-document';
import type { ApiOperationView } from '../lib/public-api-view';
import { useLocale } from '../i18n/context';
import { useReadingPosition } from '../hooks/useReadingPosition';
import {
  apiDocsNavigation,
  apiOperationLabels,
  bundledApiDocumentation,
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
        {fields.map(({ name, type, description, defaultValue, required }) => (
          <tr role="row" key={name}>
            <th role="rowheader" scope="row">
              <code>{name}</code>
              <span className="api-docs__type">{type}</span>
              {required && <small>{t('Required')}</small>}
              {defaultValue !== undefined && (
                <small>
                  {t('Default')}: <code>{defaultValue}</code>
                </small>
              )}
            </th>
            <td role="cell">
              <p lang="en">{description}</p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocCode(props: { label: string; code: string; example: string }) {
  // A replacement document must not report an old, still-pending copy as successful.
  return <CopyableDocCode key={props.code} {...props} />;
}

function CopyableDocCode({
  label,
  code,
  example,
}: {
  label: string;
  code: string;
  example: string;
}) {
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

function Method({ operation }: { operation: ApiOperationView }) {
  return (
    <p
      className="api-docs__method"
      id={operation.operationId !== operation.sectionId ? operation.operationId : undefined}
      tabIndex={-1}
    >
      <span>{operation.method}</span>
      <code>{operation.path}</code>
    </p>
  );
}

export default function ApiDocumentationPage() {
  const { t } = useLocale();
  const [loaded, setLoaded] = useState<PublicApiDocumentResult>({
    document: bundledApiDocumentation,
    source: 'bundled',
    fallback: false,
  });
  const [checking, setChecking] = useState(Boolean(apiSpecUrl));
  useEffect(() => {
    const sourceUrl = apiSpecUrl;
    if (!sourceUrl) return;
    const controller = new AbortController();
    const deadline = performance.now() + publicApiSpecTimeoutMs;
    const fallback: PublicApiDocumentResult = {
      document: bundledApiDocumentation,
      source: 'bundled',
      fallback: true,
    };
    // The deadline includes loading the transport chunk, fetching and validating the document.
    const timer = setTimeout(() => finish(), publicApiSpecTimeoutMs);
    function finish(result: PublicApiDocumentResult = fallback) {
      if (controller.signal.aborted) return;
      clearTimeout(timer);
      const next = performance.now() < deadline ? result : fallback;
      controller.abort();
      setLoaded(next);
      setChecking(false);
    }
    void import('../lib/public-api-loader')
      .then(async ({ loadPublicApiDocument }) => {
        if (controller.signal.aborted) return;
        const remaining = deadline - performance.now();
        if (remaining <= 0) {
          finish();
          return;
        }
        const result = await loadPublicApiDocument({
          bundled: bundledApiDocumentation,
          url: sourceUrl,
          signal: controller.signal,
          timeoutMs: remaining,
        });
        finish(result);
      })
      .catch(() => finish());
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  const document = loaded.document;
  const {
    endpoints: apiEndpoints,
    byId,
    hostSummaryFields,
    portFields,
    tlsFields,
    securityTxtFields,
    productFields,
    analyticsFields,
    bucketFields,
    bucketAnalyticsFields,
    filterFields,
    rangeFields,
    privateFields,
    valueSyntax,
    filterCatalogue,
  } = document;
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
                window.document.getElementById(item.id)?.focus({ preventScroll: true });
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
          <code>{document.serverUrl}</code>
        </div>
        <div className="api-docs__base" data-document-version={document.version}>
          <span>{t('Documentation version')}</span>
          <code>{document.version}</code>
          <span>OpenAPI {document.openapi}</span>
        </div>
        <Text as="p" className="api-docs__note">
          This version identifies the documentation artifact, not a backend release.
        </Text>
        <p className="api-docs__note" role="status" data-document-source={loaded.source}>
          {checking
            ? t('Checking the configured document. The bundled reference remains available.')
            : loaded.fallback
              ? t(
                  'The configured document is unavailable or incompatible. Showing the bundled reference.',
                )
              : loaded.source === 'remote'
                ? t('Showing the validated configured document.')
                : t('Showing the bundled reference.')}
        </p>
        <Text as="p" className="api-docs__note">
          Technical descriptions come from the English source contract. Navigation and interface
          labels remain in your selected language.
        </Text>
        <p className="api-docs__note">
          <a
            className="api-docs__link"
            href={loaded.source === 'remote' ? apiSpecUrl : siteHref('/api/client.openapi.json')}
          >
            {t('View OpenAPI JSON')}
          </a>
          {' · '}
          {t('Source document')}: <code>{document.source.name}</code>
        </p>
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
              Send your account API key in the X-API-Key header. The method allow-list below is
              separate from the website rules for issuing an API key.
            </Text>
            <Text as="p">
              Set APCOSYS_API_KEY in your server environment before using the cURL examples. Keep
              credentials outside browser code. Examples on this page are copied as text and are
              never executed here.
            </Text>
            <DocCode
              label="First host search"
              code={byId['search-hosts'].requestExample}
              example="first-request"
            />
            <Text as="p" className="api-docs__note">
              Example responses use synthetic records and documentation addresses. Stored
              observations describe the collection time, not a live check of the host.
            </Text>
            <p lang="en">{document.authenticationNote}</p>
          </ApiDocsSection>

          <ApiDocsSection id="access-limits" title="Access and request limits.">
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('HTTP method allow-list')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Method')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Plans and credit weight')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {apiEndpoints.map((operation) => (
                  <tr role="row" key={operation.operationId}>
                    <th role="rowheader" scope="row">
                      <code>
                        {operation.method} {operation.path}
                      </code>
                    </th>
                    <td role="cell">
                      <p>{operation.plans.map((plan) => t(plan)).join(', ')}</p>
                      <p>
                        {t('Credit weight')}: <code>{operation.creditWeight}</code>
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text as="p">
              Rate limits and credit charges are separate. Credit weight is not a rate-limit unit.
            </Text>
            <Text as="p">
              {t(
                'Default HTTP token bucket: {rate} tokens per second, burst {burst}. These are server defaults, not the pricing-table API rates.',
                {
                  rate: document.rate.tokensPerSecond,
                  burst: document.rate.burst,
                },
              )}
            </Text>
            <p lang="en">
              {document.rate.scope}. {document.rate.failureMode}.
            </p>
            <Text as="p">
              {t('Credit reuse window: {seconds} seconds.', {
                seconds: document.credits.reuseSeconds,
              })}
            </Text>
            <p lang="en">
              {document.credits.reuseScope}. {document.credits.bodyKey}.
            </p>
            <p lang="en">
              {document.credits.balanceOwner}. {document.credits.analyticsWeight}.
            </p>
            <Text as="p">
              Field and value restrictions also apply inside filters and ranges. A restricted field
              or value returns HTTP 402. Exceeding the request rate returns HTTP 429.
            </Text>
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Restricted search fields')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Plan')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Blocked fields')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {document.planRestrictions.map(({ plan, fields }) => (
                  <tr role="row" key={plan}>
                    <th role="rowheader" scope="row">
                      {t(plan)}
                    </th>
                    <td role="cell">
                      {fields.length ? <code>{fields.join(', ')}</code> : t('None')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Restricted search values')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Plan')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Blocked values')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {document.planRestrictions.map(({ plan, values }) => (
                  <tr role="row" key={plan}>
                    <th role="rowheader" scope="row">
                      {t(plan)}
                    </th>
                    <td role="cell">
                      {values.length ? <code>{values.join(', ')}</code> : t('None')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Fields hidden from host detail responses')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Plan')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Hidden fields')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {document.planRestrictions.map(({ plan, hiddenFields }) => (
                  <tr role="row" key={plan}>
                    <th role="rowheader" scope="row">
                      {t(plan)}
                    </th>
                    <td role="cell">
                      {hiddenFields.length ? <code>{hiddenFields.join(', ')}</code> : t('None')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {apiEndpoints.map(({ operationId, sectionId, method, path }) => (
                <a href={'#' + sectionId} key={method + path}>
                  <span>{method}</span>
                  <code>{path}</code>
                  <span>{t(apiOperationLabels[operationId])}</span>
                </a>
              ))}
            </div>
          </ApiDocsSection>

          <ApiDocsSection id="search-hosts" title="Search hosts.">
            <Method operation={byId['search-hosts']} />
            <p lang="en">{byId['search-hosts'].description}</p>
            <details className="api-docs__disclosure">
              <summary>{t('Index selection and host types')}</summary>
              <FieldTable
                title={t('Index selection and host types')}
                fields={document.indexSelectionFields}
              />
            </details>
            <FieldTable
              title={t('Request body fields')}
              fields={byId['search-hosts'].requestFields}
            />
            <FieldTable title={t('Search response')} fields={byId['search-hosts'].responseFields} />
            <FieldTable title={t('Host summary · hosts[]')} fields={hostSummaryFields} />
            <DocCode
              label="Example host-search response"
              code={byId['search-hosts'].responseExample}
              example="hosts-response"
            />
            <Text as="p">
              To continue, increase page and keep the same filters. Compare total with the records
              already returned.
            </Text>
          </ApiDocsSection>

          <ApiDocsSection id="host-details" title="Inspect one host.">
            <Method operation={byId['get-host']} />
            <p lang="en">{byId['get-host'].description}</p>
            <DocCode
              label="Host lookup"
              code={byId['get-host'].requestExample}
              example="host-details"
            />
            <FieldTable
              title={t('Host detail response')}
              fields={byId['get-host'].responseFields}
            />
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
                <code>ports[].robots_txt</code>
              </summary>
              <FieldTable title={t('Robots fields')} fields={document.robotsTxtFields} />
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
            <Method operation={byId['host-analytics']} />
            <p lang="en">{byId['host-analytics'].description}</p>
            <DocCode
              label="Host analytics request"
              code={byId['host-analytics'].requestExample}
              example="analytics"
            />
            <FieldTable title={t('Analytics response')} fields={analyticsFields} />

            <DocCode
              label="Example analytics response"
              code={byId['host-analytics'].responseExample}
              example="analytics-response"
            />
          </ApiDocsSection>

          <ApiDocsSection id="search-buckets" title="Search storage records.">
            <Method operation={byId['search-buckets']} />
            <p lang="en">{byId['search-buckets'].description}</p>
            <DocCode
              label="Bucket search request"
              code={byId['search-buckets'].requestExample}
              example="buckets"
            />
            <FieldTable
              title={t('Bucket request fields')}
              fields={byId['search-buckets'].requestFields}
            />
            <FieldTable
              title={t('Bucket response')}
              fields={byId['search-buckets'].responseFields}
            />
            <FieldTable title={t('Storage record · result[]')} fields={bucketFields} />
          </ApiDocsSection>

          <ApiDocsSection id="bucket-analytics" title="Aggregate bucket results.">
            <Method operation={byId['bucket-analytics']} />
            <p lang="en">{byId['bucket-analytics'].description}</p>
            <DocCode
              label="Bucket analytics request"
              code={byId['bucket-analytics'].requestExample}
              example="bucket-analytics"
            />
            <FieldTable title={t('Bucket analytics response')} fields={bucketAnalyticsFields} />
          </ApiDocsSection>

          <ApiDocsSection id="private-search" title="Query private scan data.">
            {apiEndpoints
              .filter(({ sectionId }) => sectionId === 'private-search')
              .map((operation) => (
                <div className="api-docs__operation" key={operation.operationId}>
                  <Method operation={operation} />
                  <p lang="en">{operation.description}</p>
                </div>
              ))}
            <FieldTable title={t('Private-search scope fields')} fields={privateFields} />
            <details className="api-docs__disclosure">
              <summary>{t('Private service fields')}</summary>
              <FieldTable title={t('Private service fields')} fields={document.privatePortFields} />
            </details>
            <DocCode
              label="Private host search"
              code={byId['private-hosts'].requestExample}
              example="private-hosts"
            />
            <DocCode
              label="Private host lookup"
              code={byId['get-private-host'].requestExample}
              example="private-host"
            />
            <DocCode
              label="Private analytics request"
              code={byId['private-analytics'].requestExample}
              example="private-analytics"
            />
          </ApiDocsSection>

          <ApiDocsSection id="filters" title="Filter syntax and field names.">
            <FieldTable title={t('Filter item · simple_search_filters[]')} fields={filterFields} />
            <p lang="en">{document.filterDescription}</p>
            <p lang="en">{document.headerNote}</p>
            <DocCode
              label="Nested filter example"
              code={document.filterExample}
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
                      <p lang="en">{description}</p>
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
              code={document.headerExample}
              example="header-filter"
            />
            <table role="table" className="api-docs__table api-docs__fields">
              <caption>{t('Field aliases')}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t('Alias')}
                  </th>
                  <th role="columnheader" scope="col">
                    {t('Field')}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {document.aliases.map(({ name, value }) => (
                  <tr role="row" key={name}>
                    <th role="rowheader" scope="row">
                      <code>{name}</code>
                    </th>
                    <td role="cell">
                      <code>{value}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <DocCode label="Example error response" code={document.errorExample} example="error" />
            <table className="api-docs__table api-docs__errors">
              <caption>{t('HTTP status codes')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Status')}</th>
                  <th scope="col">{t('Meaning and next step')}</th>
                </tr>
              </thead>
              <tbody>
                {document.errors.map(({ code, rows }) => (
                  <tr key={code}>
                    <th scope="row">
                      <code>{code}</code>
                    </th>
                    <td>
                      {rows.map(({ error, when }) => (
                        <div key={error + when}>
                          <strong>
                            <code>{error}</code>
                          </strong>
                          <p lang="en">{when}</p>
                        </div>
                      ))}
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
            <details className="api-docs__disclosure">
              <summary>{t('Contract notes and unresolved details')}</summary>
              {document.notes.map(({ id, note }) => (
                <p lang="en" key={id}>
                  <code>{id}</code> — {note}
                </p>
              ))}
            </details>
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
