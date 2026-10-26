import { useState } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { demoHosts } from '../../content/product-demo';
import { Icon } from '../ui/Icon';
import { useLocale } from '../../i18n/context';

/** Deliberately cropped product details: each explains one concept, never a whole dashboard. */
export function DataLens({ selected }: { selected: number }) {
  const { t } = useLocale();
  const titles = [
    'Host identity',
    'Domain records',
    'Service observations',
    'Detected technology',
    'Version context',
  ];
  return (
    <div className="data-lens" aria-label={t(titles[selected]!)}>
      <div className="data-lens__header">
        <span>{t(titles[selected]!)}</span>
        <span>{t('Example data')}</span>
      </div>
      <MorphPanel>
        <div className="data-lens__body" data-morph-enter>
          {selected === 0 ? (
            <>
              <div className="data-lens__identity">
                <Icon name="search" />
                <strong>198.51.100.24</strong>
              </div>
              <dl>
                <div>
                  <dt>{t('Hostname')}</dt>
                  <dd>portal.example.com</dd>
                </div>
                <div>
                  <dt>{t('Services')}</dt>
                  <dd>HTTPS · HTTP</dd>
                </div>
                <div>
                  <dt>{t('Evidence')}</dt>
                  <dd>{t('Response headers')}</dd>
                </div>
              </dl>
            </>
          ) : selected === 1 ? (
            <div className="domain-tree">
              <strong>example.com</strong>
              {demoHosts.map((h) => (
                <div key={h.ip}>
                  <span>{h.hostname}</span>
                  <code>{h.ip}</code>
                </div>
              ))}
            </div>
          ) : selected === 2 ? (
            <>
              <div className="data-lens__columns">
                <span>{t('Port')}</span>
                <span>{t('Protocol')}</span>
                <span>{t('Observation')}</span>
              </div>
              {demoHosts[0]!.services.map((s) => (
                <div className="data-lens__service" key={s.port}>
                  <code>{s.port}</code>
                  <strong>{s.protocol}</strong>
                  <span>{s.technology}</span>
                </div>
              ))}
            </>
          ) : selected === 3 ? (
            <div className="technology-stack">
              {[
                ['nginx', '1.24.0', 'HTTP Server header'],
                ['OpenSSH', '9.6', 'SSH identification'],
              ].map(([name, version, source]) => (
                <div key={name}>
                  <strong>
                    {name}
                    <small>{version}</small>
                  </strong>
                  <span>{t(source!)}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="version-path">
                <span>{t('Observed version')}</span>
                <i />
                <span>{t('Vendor advisory')}</span>
                <i />
                <span>{t('Validation')}</span>
              </div>
              <p>
                {t(
                  'A version match is a research lead. Check patches and configuration before confirming a vulnerability.',
                )}
              </p>
            </>
          )}
        </div>
      </MorphPanel>
      <div className="data-lens__footer">{t('One observation, with its technical context.')}</div>
    </div>
  );
}

export function SearchFragment() {
  const { t } = useLocale();
  const [query, setQuery] = useState('example.com');
  return (
    <div className="query-fragment" aria-label={t('Search starting points')}>
      <div className="query-fragment__input">
        <Icon name="search" />
        <code>{query}</code>
        <span>↵</span>
      </div>
      <p>{t('Start with an attribute you already know.')}</p>
      <div className="query-fragment__options">
        {['example.com', '198.51.100.24', 'nginx 1.24.0'].map((q, i) => (
          <button type="button" key={q} aria-pressed={query === q} onClick={() => setQuery(q)}>
            <span>{t(['Domain', 'IP address', 'Technology'][i]!)}</span>
            <code>{q}</code>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HostFragment() {
  const { t } = useLocale();
  const host = demoHosts[0]!;
  return (
    <div className="host-fragment">
      <header>
        <span>{t('Host view')}</span>
        <strong>{host.ip}</strong>
        <small>{host.hostname}</small>
      </header>
      <div className="host-fragment__facts">
        <div>
          <span>HTTPS</span>
          <strong>443</strong>
        </div>
        <div>
          <span>HTTP</span>
          <strong>80</strong>
        </div>
        <div>
          <span>{t('Technology')}</span>
          <strong>nginx</strong>
        </div>
      </div>
      <pre>
        <code>{'HTTP/1.1 200 OK\nServer: nginx/1.24.0'}</code>
      </pre>
      <p>{t('Service response · example record')}</p>
    </div>
  );
}

export function CaseFragment({ kind }: { kind: 'scope' | 'technology' | 'indicator' }) {
  const { t } = useLocale();
  if (kind === 'scope')
    return (
      <div className="case-fragment case-fragment--scope">
        <header>
          <span>{t('Programme boundary')}</span>
          <strong>example.com</strong>
        </header>
        <div className="scope-boundary">
          {demoHosts.map((h, index) => (
            <div key={h.ip}>
              <span className="scope-boundary__number" aria-hidden="true">
                0{index + 1}
              </span>
              <span>
                <strong>{h.hostname}</strong>
                <small>{h.ip}</small>
              </span>
              <span className="scope-boundary__status">{t('Requires verification')}</span>
            </div>
          ))}
        </div>
        <p>{t('Candidate infrastructure. Confirm each target against the programme rules.')}</p>
      </div>
    );
  if (kind === 'technology')
    return (
      <div className="case-fragment case-fragment--technology">
        <header>
          <span>{t('Technology evidence')}</span>
          <strong>
            nginx <em>1.24.0</em>
          </strong>
        </header>
        <div className="version-path">
          <span>{t('Detection')}</span>
          <i />
          <span>{t('Advisory')}</span>
          <i />
          <span>{t('Verification')}</span>
        </div>
        <dl>
          <div>
            <dt>{t('Observed signal')}</dt>
            <dd>{t('HTTP Server header')}</dd>
          </div>
          <div>
            <dt>{t('Version applicability')}</dt>
            <dd>{t('Check vendor advisory')}</dd>
          </div>
          <div>
            <dt>{t('Patch state')}</dt>
            <dd>{t('Needs validation')}</dd>
          </div>
        </dl>
        <p>{t('An association does not establish exploitability.')}</p>
      </div>
    );
  return (
    <div className="case-fragment case-fragment--indicator">
      <header>
        <span>{t('Indicator trail')}</span>
        <strong>198.51.100.24</strong>
      </header>
      <div className="indicator-trail">
        {[
          ['IP address', '198.51.100.24'],
          ['Observed hostname', 'portal.example.com'],
          ['Service attribute', '443 · HTTPS · nginx'],
        ].map(([a, b], i) => (
          <div key={a}>
            <span>0{i + 1}</span>
            <p>
              <small>{t(a!)}</small>
              <strong>{b}</strong>
            </p>
          </div>
        ))}
      </div>
      <p>{t('Follow an attribute into the next query. Similarity alone is not attribution.')}</p>
    </div>
  );
}
