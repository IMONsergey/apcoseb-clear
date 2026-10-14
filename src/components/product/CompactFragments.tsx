import { useState } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { demoHosts } from '../../content/product-demo';
import { Icon } from '../ui/Icon';

/** Deliberately cropped product details: each explains one concept, never a whole dashboard. */
export function DataLens({ selected }: { selected: number }) {
  const titles = [
    'Host identity',
    'Domain records',
    'Service observations',
    'Detected technology',
    'Version context',
  ];
  return (
    <div className="data-lens" aria-label={titles[selected]}>
      <div className="data-lens__header">
        <span>{titles[selected]}</span>
        <span>Example data</span>
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
                  <dt>Hostname</dt>
                  <dd>portal.example.com</dd>
                </div>
                <div>
                  <dt>Services</dt>
                  <dd>HTTPS · HTTP</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>Response headers</dd>
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
                <span>Port</span>
                <span>Protocol</span>
                <span>Observation</span>
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
                  <span>{source}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="version-path">
                <span>Observed version</span>
                <i />
                <span>Vendor advisory</span>
                <i />
                <span>Validation</span>
              </div>
              <p>
                A version match is a research lead. Check patches and configuration before
                confirming a vulnerability.
              </p>
            </>
          )}
        </div>
      </MorphPanel>
      <div className="data-lens__footer">One observation, with its technical context.</div>
    </div>
  );
}

export function SearchFragment() {
  const [query, setQuery] = useState('example.com');
  return (
    <div className="query-fragment" aria-label="Search starting points">
      <div className="query-fragment__input">
        <Icon name="search" />
        <code>{query}</code>
        <span>↵</span>
      </div>
      <p>Start with an attribute you already know.</p>
      <div className="query-fragment__options">
        {['example.com', '198.51.100.24', 'nginx 1.24.0'].map((q, i) => (
          <button type="button" key={q} aria-pressed={query === q} onClick={() => setQuery(q)}>
            <span>{['Domain', 'IP address', 'Technology'][i]}</span>
            <code>{q}</code>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HostFragment() {
  const host = demoHosts[0]!;
  return (
    <div className="host-fragment">
      <header>
        <span>Host view</span>
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
          <span>Technology</span>
          <strong>nginx</strong>
        </div>
      </div>
      <pre>
        <code>{'HTTP/1.1 200 OK\nServer: nginx/1.24.0'}</code>
      </pre>
      <p>Service response · illustrative record</p>
    </div>
  );
}

export function CaseFragment({ kind }: { kind: 'scope' | 'technology' | 'indicator' }) {
  if (kind === 'scope')
    return (
      <div className="case-fragment case-fragment--scope">
        <header>
          <span>Programme boundary</span>
          <strong>example.com</strong>
        </header>
        <div className="scope-boundary">
          {demoHosts.map((h) => (
            <div key={h.ip}>
              <i />
              <span>
                <strong>{h.hostname}</strong>
                <small>{h.ip}</small>
              </span>
              <span>Review scope</span>
            </div>
          ))}
        </div>
        <p>Candidate infrastructure. Confirm each target against the programme rules.</p>
      </div>
    );
  if (kind === 'technology')
    return (
      <div className="case-fragment case-fragment--technology">
        <header>
          <span>Technology evidence</span>
          <strong>
            nginx <em>1.24.0</em>
          </strong>
        </header>
        <div className="version-path">
          <span>Detection</span>
          <i />
          <span>Advisory</span>
          <i />
          <span>Verification</span>
        </div>
        <dl>
          <div>
            <dt>Observed signal</dt>
            <dd>HTTP Server header</dd>
          </div>
          <div>
            <dt>Version applicability</dt>
            <dd>Check vendor advisory</dd>
          </div>
          <div>
            <dt>Patch state</dt>
            <dd>Needs validation</dd>
          </div>
        </dl>
        <p>An association does not establish exploitability.</p>
      </div>
    );
  return (
    <div className="case-fragment case-fragment--indicator">
      <header>
        <span>Indicator trail</span>
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
              <small>{a}</small>
              <strong>{b}</strong>
            </p>
          </div>
        ))}
      </div>
      <p>Follow an attribute into the next query. Similarity alone is not attribution.</p>
    </div>
  );
}
