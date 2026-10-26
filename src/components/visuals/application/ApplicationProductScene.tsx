import { assetUrl } from '../../../content/assets';
import type { ResearchScene } from '../../../content/research';
import { useLocale } from '../../../i18n/context';
import { ApplicationGlyph as Glyph } from './ApplicationGlyph';

// Reserved-address records from the current application demo, kept consistent across scenes.
const host = { ip: '192.0.2.10', domain: 'node-1.example.com', asn: 'AS64496' };

function QueryBar({ query = 'nginx', compact = false }: { query?: string; compact?: boolean }) {
  const { t } = useLocale();
  return (
    <div className={`application-search-box${compact ? ' application-search-box--compact' : ''}`}>
      <div className="application-search-tools">
        <span data-demo-target={compact ? undefined : 'query-filters'}>
          <Glyph name="plus" />
          {t('Filters')}
        </span>
        <span>
          {t('All types')}
          <Glyph name="chevron" />
        </span>
        {!compact && (
          <span className="application-saved">
            <Glyph name="clock" />
            {t('History')}
          </span>
        )}
      </div>
      <div className="application-query-bar" data-demo-target="query-input">
        {compact ? (
          <span className="application-query-filter" data-demo-target="query-filters">
            <Glyph name="filter" />
          </span>
        ) : (
          <Glyph name="search" />
        )}
        <span data-demo-query>{query}</span>
        <span className="application-search-action" data-demo-target="query-submit">
          <span>{t('Search')}</span>
          <span>
            <Glyph name="arrow" />
          </span>
        </span>
      </div>
    </div>
  );
}

function Country({ secondary = false }: { secondary?: boolean }) {
  const { t } = useLocale();
  return (
    <span className="application-country">
      <img
        src={assetUrl('application', secondary ? 'netherlands.svg' : 'germany.svg')}
        width="18"
        height="12"
        alt=""
      />
      {t(secondary ? 'Netherlands' : 'Germany')}
    </span>
  );
}

function ResultRow({ secondary = false }: { secondary?: boolean }) {
  const { t } = useLocale();
  return (
    <div
      className={`application-result${secondary ? ' application-result--secondary' : ''}`}
      data-demo-target={secondary ? 'result-next' : 'result-first'}
    >
      <div className="application-result-identity">
        <span className="application-host-icon">
          <Glyph name="server" />
        </span>
        <div>
          <strong className="application-result-address">
            {secondary ? '192.0.2.144' : host.ip}
          </strong>
          <span className="application-result-network">{t('Example Research Network')}</span>
        </div>
      </div>
      <div className="application-result-services">
        <span className="application-ports">
          <span>443</span>
          <span>80</span>
          {!secondary && <span>22</span>}
        </span>
        <span className="application-technology">
          <Glyph name="lock" /> HTTPS
          <span className="application-result-extra"> · HTTP</span>
        </span>
      </div>
      <Country secondary={secondary} />
    </div>
  );
}

function HostHeading() {
  return (
    <div className="application-host-heading" data-demo-target="host-address">
      <div>
        <strong>{host.ip}</strong>
        <span className="application-link">{host.domain}</span>
      </div>
      <Country />
    </div>
  );
}

function ObjectTabs({ tls = false }: { tls?: boolean }) {
  const { t } = useLocale();
  return (
    <div className="application-object-tabs">
      <span data-selected={!tls}>
        <Glyph name="server" />
        {t('Response')}
      </span>
      <span data-selected={tls} data-demo-target="tls-tab">
        <Glyph name="lock" />
        TLS
      </span>
      <span>
        <Glyph name="cube" />
        {t('Products & CVE')}
      </span>
    </div>
  );
}

function QueryScene() {
  const { t } = useLocale();
  return (
    <div className="application-query-scene">
      <div className="application-query-intro">
        <h4 className="application-query-title">{t('Search internet infrastructure.')}</h4>
        <p>{t('Explore hosts, services and networks.')}</p>
      </div>
      <QueryBar />
      <div className="application-query-examples" data-demo-target="query-examples">
        <span>
          <Glyph name="search" />
          {t('Text query')}
        </span>
        <span>
          <Glyph name="globe" />
          {t('Domain')}
        </span>
        <span>
          <Glyph name="server" />
          IP / CIDR
        </span>
        <span>
          <Glyph name="cube" />
          {t('Technology')}
        </span>
      </div>
      <p className="application-query-hint" data-demo-target="query-hint">
        {t('Try')} <span>nginx</span> <span>example.com</span>
      </p>
    </div>
  );
}

function ResultsScene() {
  const { t } = useLocale();
  return (
    <div className="application-results-scene">
      <QueryBar compact />
      <div className="application-object-tabs application-results-tabs">
        <span data-selected="true">
          <Glyph name="list" />
          {t('Results')}
        </span>
        <span>
          <Glyph name="chart" />
          {t('Analytics')}
        </span>
        <span className="application-saved">
          <Glyph name="bookmark" />
          {t('Save')}
        </span>
      </div>
      <h4 className="application-results-heading">
        <span className="application-results-all">{t('4 hosts returned')}</span>
        <span className="application-results-filtered">{t('1 result')}</span>
        <span className="application-results-page">{t('Page 1')}</span>
      </h4>
      <div className="application-results-table">
        <div className="application-results-columns">
          <span>{t('Host / network')}</span>
          <span>{t('Services')}</span>
          <span>{t('Location')}</span>
        </div>
        <div className="application-result-list">
          <ResultRow />
          <ResultRow secondary />
        </div>
      </div>
      <div className="application-facets" data-demo-target="country-filter">
        <div className="application-facets-heading">
          <Glyph name="filter" />
          <strong>{t('Filters')}</strong>
          <Glyph name="close" />
        </div>
        <span className="application-muted">{t('Country')}</span>
        <div className="application-facet application-facet--de">
          <Country />
          <Glyph name="check" />
        </div>
        <div className="application-facet">
          <Country secondary />
        </div>
        <span className="application-filter-apply" data-demo-target="filter-apply">
          {t('Apply conditions')}
          <Glyph name="arrow" />
        </span>
      </div>
    </div>
  );
}

function HostScene() {
  const { t } = useLocale();
  return (
    <div className="application-host-scene">
      <HostHeading />
      <div className="application-host-network">
        {host.asn} · {t('Example Research Network')}
      </div>
      <div className="application-object-tabs application-host-tabs">
        <span>{t('Overview')}</span>
        <span data-selected="true">{t('Services')}</span>
        <span>{t('DNS & domains')}</span>
      </div>
      <div className="application-host-workspace">
        <div className="application-service-list">
          <h4 className="application-host-services-title">
            {t('Services')}
            <span>100</span>
          </h4>
          <div className="application-services" data-demo-target="host-services">
            <span data-selected="true">
              <img src={assetUrl('application', 'nginx.svg')} width="14" height="14" alt="" />
              <strong>443</strong> HTTPS
            </span>
            <span>
              <Glyph name="globe" />
              <strong>80</strong> HTTP
            </span>
            <span>
              <Glyph name="server" />
              <strong>22</strong> SSH
            </span>
          </div>
        </div>
        <div className="application-response" data-demo-target="host-response">
          <div className="application-response-heading">
            <strong>
              443 <span>HTTPS</span>
            </strong>
            <span>200 OK</span>
          </div>
          <div className="application-service-tabs">
            <span data-selected="true">{t('Response')}</span>
            <span>TLS</span>
          </div>
          <pre>
            <code>{'HTTP/1.1 200 OK\nServer: nginx'}</code>
          </pre>
          <div className="application-product" data-demo-target="host-product">
            <span>{t('Detected product')}</span>
            <span>
              <img src={assetUrl('application', 'nginx.svg')} width="12" height="12" alt="" />
              nginx <span className="application-muted">1.0</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceScene() {
  const { locale, t } = useLocale();
  const date = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <div className="application-evidence-scene">
      <HostHeading />
      <div className="application-tls-summary" data-demo-target="tls-service">
        <span className="application-tls-service" data-demo-service="443">
          <Glyph name="lock" />
          443 / HTTPS
        </span>
        <span className="application-status">TLS 1.3</span>
      </div>
      <ObjectTabs tls />
      <div className="application-certificate" data-demo-target="tls-identity">
        <h4 className="application-certificate-title">
          <img src={assetUrl('application', 'certificate.svg')} width="14" height="14" alt="" />
          {t('Certificate identity')}
        </h4>
        <dl>
          <div>
            <dt>{t('Subject')}</dt>
            <dd>{host.domain}</dd>
          </div>
          <div>
            <dt>{t('Issuer')}</dt>
            <dd>{t('Example Certificate Authority')}</dd>
          </div>
        </dl>
      </div>
      <div className="application-validity" data-demo-target="tls-validity">
        <h4>{t('Validity period')}</h4>
        <span>
          <time dateTime="2026-10-01">{date.format(new Date('2026-10-01T00:00:00Z'))}</time>
          {' – '}
          <time dateTime="2027-01-01">{date.format(new Date('2027-01-01T00:00:00Z'))}</time>
        </span>
      </div>
      <div className="application-dns-names" data-demo-target="tls-names">
        <span>{t('DNS names')}</span>
        <code>{host.domain}</code>
      </div>
    </div>
  );
}

function RefinedScene() {
  const { t } = useLocale();
  return (
    <div className="application-refine-scene">
      <QueryBar query={host.domain} compact />
      <div className="application-condition" data-demo-target="refine-condition">
        <h4 className="application-refine-heading">
          <Glyph name="filter" />
          {t('Applied condition')}
        </h4>
        <div>
          <span>{t('Domain')}</span>
          <Glyph name="chevron" />
          <span>{host.domain}</span>
        </div>
      </div>
      <div className="application-applied" data-demo-target="refine-applied">
        <span>
          {t('Domain')} · {host.domain}
        </span>
        <Glyph name="close" />
      </div>
      <h4 className="application-refine-result-count">{t('1 result')}</h4>
      <ResultRow />
    </div>
  );
}

export function ApplicationProductScene({ scene }: { scene: ResearchScene }) {
  return (
    <div className="application-product-scene">
      {scene === 'query' && <QueryScene />}
      {scene === 'results' && <ResultsScene />}
      {scene === 'host' && <HostScene />}
      {scene === 'evidence' && <EvidenceScene />}
      {scene === 'suggestions' && <RefinedScene />}
    </div>
  );
}
