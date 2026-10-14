import '../../styles/product-evidence.css';
import '../../styles/product-motion.css';
import { useId, useRef, useState } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { useEvidencePlayback } from '../../hooks/useEvidencePlayback';
import { productUrl } from '../../config/site';
import { demoNotice, demoScenarios, type EvidenceScenario } from '../../content/product-demo';
export type { EvidenceScenario } from '../../content/product-demo';
export type EvidenceMode = 'query' | 'results' | 'host' | 'services' | 'cve' | 'continue';

export function ProductEvidence({
  mode = 'results',
  scenario = 'domain',
  compact = false,
  selectedHost,
  onSelectHost,
  embedded = false,
  showPlaybackStatus = true,
}: {
  mode?: EvidenceMode;
  scenario?: EvidenceScenario;
  compact?: boolean;
  selectedHost?: number;
  onSelectHost?: (index: number) => void;
  embedded?: boolean;
  showPlaybackStatus?: boolean;
}) {
  const id = useId();
  const [localSelection, setLocalSelection] = useState(0);
  const data = demoScenarios[scenario];
  const selected = Math.min(selectedHost ?? localSelection, data.hosts.length - 1);
  const host = data.hosts[selected]!;
  const [serviceIndex, setServiceIndex] = useState(0);
  const service = host.services[serviceIndex] ?? host.services[0]!;
  const banner =
    service.protocol === 'HTTPS'
      ? ['HTTP/1.1 200 OK', 'Server: ' + service.technology.replace(' ', '/')]
      : service.protocol === 'SSH'
        ? ['SSH-2.0-OpenSSH_9.6', 'Protocol: SSH / TCP']
        : ['HTTP/1.1 301 Moved Permanently', 'Location: https://' + host.hostname];
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEvidencePlayback(root, scenario + mode + host.ip + service.port, paused);
  return (
    <div
      ref={root}
      className={
        'product-evidence' +
        (compact ? ' product-evidence--compact' : '') +
        (embedded ? ' product-evidence--embedded' : '')
      }
      data-mode={mode}
      role="group"
      aria-label={data.description}
      aria-describedby={compact ? id : undefined}
    >
      <MorphPanel>
        <div className="product-evidence__bar">
          <span>
            Apcosys <span className="product-evidence__slash">/</span>{' '}
            {mode === 'cve' ? 'CVE CONTEXT' : 'INVESTIGATION'}
          </span>
          <button
            className="evidence-playback-toggle"
            type="button"
            aria-label={paused ? 'Play product animation' : 'Pause product animation'}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? 'Play' : 'Pause'}
            <svg viewBox="0 0 10 12" aria-hidden="true">
              <path d={paused ? 'M1 0L10 6L1 12Z' : 'M1 0H4V12H1ZM6 0H9V12H6Z'} />
            </svg>
          </button>
        </div>
        <div className="product-evidence__query">
          <span className="product-evidence__mono">
            {scenario === 'technology' ? 'RESEARCH INPUT' : 'QUERY'}
          </span>
          <strong>{data.query}</strong>
          <span className="product-evidence__hint">
            {data.hosts.length} example {data.hosts.length === 1 ? 'host' : 'hosts'}
          </span>
        </div>
        {mode === 'query' && (
          <div className="product-evidence__context-note">
            <span className="product-evidence__mono">STARTING POINT</span>
            <p>
              Begin with a known {data.label.toLowerCase()}. The records below show how the
              investigation continues. Technology input illustrates intent, not verified query
              syntax.
            </p>
          </div>
        )}
        <div className="product-evidence__layout">
          <div className="product-evidence__results">
            <div className="product-evidence__eyebrow">
              <span>SEARCH RESULTS</span>
              <span>SELECT A HOST</span>
            </div>
            {data.hosts.map((item, index) => (
              <button
                type="button"
                key={item.ip}
                className="product-evidence__result"
                aria-pressed={selected === index}
                onClick={() => {
                  setLocalSelection(index);
                  onSelectHost?.(index);
                }}
              >
                <span className="product-evidence__result-main">
                  <strong>{item.ip}</strong>
                  <small>{item.hostname}</small>
                </span>
                <span className="product-evidence__result-meta">
                  {item.services.map((s) => s.port).join(' / ')}
                  <small>{item.role}</small>
                </span>
              </button>
            ))}
            {!compact && (
              <p className="product-evidence__disclaimer" id={id}>
                {demoNotice}
              </p>
            )}
          </div>
          <div
            className="product-evidence__details"
            aria-live="polite"
            aria-atomic="true"
            data-morph-enter
          >
            <div className="product-evidence__eyebrow">
              <span>{mode === 'services' ? 'SERVICES & TECHNOLOGIES' : 'HOST DETAILS'}</span>
              <span>SELECTED</span>
            </div>
            <h3>{host.ip}</h3>
            <p className="product-evidence__meta">{host.hostname}</p>
            {!compact && (
              <div className="product-evidence__properties">
                <div>
                  <span>Evidence source</span>
                  <strong>Authored demonstration</strong>
                </div>
                <div>
                  <span>Observation time</span>
                  <strong>No live observation</strong>
                </div>
              </div>
            )}
            <div className="product-evidence__services">
              <span className="product-evidence__mono">SERVICES & TECHNOLOGIES</span>
              {host.services.map((service, index) => (
                <button
                  type="button"
                  className="product-evidence__service"
                  key={service.port}
                  aria-pressed={serviceIndex === index}
                  onClick={() => setServiceIndex(index)}
                >
                  <span className="product-evidence__port">
                    {service.port}
                    <small>/ tcp</small>
                  </span>
                  <strong>{service.protocol}</strong>
                  <span>
                    {service.technology}
                    {!compact && <small>{service.evidence}</small>}
                  </span>
                </button>
              ))}
            </div>
            <div className="evidence-response" data-morph-enter>
              <span className="product-evidence__mono">SERVICE EVIDENCE / {service.port} TCP</span>
              {banner.map((line) => (
                <code key={line}>{line}</code>
              ))}
              <span className="evidence-response__caption">Response banner · authored example</span>
            </div>
            {(mode === 'cve' || scenario === 'technology') && (
              <div className="product-evidence__cve">
                <span className="product-evidence__mono">CVE ASSOCIATIONS</span>
                <dl>
                  <div>
                    <dt>Detected product</dt>
                    <dd>{host.services[0]!.technology}</dd>
                  </div>
                  <div>
                    <dt>Applicability</dt>
                    <dd>Requires verification</dd>
                  </div>
                </dl>
                <p>
                  No CVE is asserted for this example. Check the vendor advisory, affected versions,
                  configuration and backported fixes before confirming a vulnerability.
                </p>
              </div>
            )}
            {mode === 'continue' && (
              <div className="product-evidence__next">
                <span className="product-evidence__mono">NEXT RESEARCH LEAD</span>
                <strong>{host.hostname}</strong>
                <p>{data.next}</p>
              </div>
            )}
          </div>
        </div>
        {showPlaybackStatus && (
          <div className="evidence-playback" aria-hidden="true">
            <span className="evidence-playback__dot" />
            <span data-playback-label>Query, host, service, context</span>
            <span className="evidence-playback__track">
              <i data-playback-progress />
            </span>
          </div>
        )}
        {!embedded && (
          <div className="product-evidence__footer">
            <span>
              {compact
                ? demoNotice
                : 'Observation, detection, association: different levels of certainty.'}
            </span>
            <a href={productUrl + '/search'}>Open Apcosys Search</a>
          </div>
        )}
        {compact && (
          <span className="sr-only" id={id}>
            {demoNotice}
          </span>
        )}
      </MorphPanel>
      <span className="evidence-cursor" aria-hidden="true">
        <svg viewBox="0 0 23 31">
          <path d="M2 1v23l6-5 5 10 4-2-5-10 9-1Z" />
        </svg>
      </span>
    </div>
  );
}
