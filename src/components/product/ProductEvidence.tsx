import '../../styles/product-evidence.css';
import '../../styles/product-motion.css';
import { useId, useRef, useState } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { useEvidencePlayback } from '../../hooks/useEvidencePlayback';
import { productUrl } from '../../config/site';
import { demoNotice, demoScenarios, type EvidenceScenario } from '../../content/product-demo';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
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
  const { locale, t } = useLocale();
  const formatCount = (value: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale).format(value);
  const id = useId();
  const [localSelection, setLocalSelection] = useState(0);
  const data = demoScenarios[scenario];
  const selected = Math.min(selectedHost ?? localSelection, data.hosts.length - 1);
  const host = data.hosts[selected]!;
  const [serviceIndex, setServiceIndex] = useState(0);
  const activeServiceIndex = Math.min(serviceIndex, host.services.length - 1);
  const service = host.services[activeServiceIndex]!;
  const banner =
    service.protocol === 'HTTPS'
      ? ['HTTP/1.1 200 OK', 'Server: ' + service.technology.replace(' ', '/')]
      : service.protocol === 'SSH'
        ? ['SSH-2.0-OpenSSH_9.6', 'Protocol: SSH / TCP']
        : ['HTTP/1.1 301 Moved Permanently', 'Location: https://' + host.hostname];
  const root = useRef<HTMLDivElement>(null);
  const [playbackCaption, setPlaybackCaption] = useState('Query, host, service, context');
  useEvidencePlayback(root, scenario + mode + host.ip + service.port, false, setPlaybackCaption);
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
      aria-label={t(data.description)}
      aria-describedby={compact ? id : undefined}
    >
      <MorphPanel>
        <div className="product-evidence__bar">
          <span>
            Apcosys <span className="product-evidence__slash">/</span>{' '}
            <LocaleText>{t(mode === 'cve' ? 'CVE CONTEXT' : 'INVESTIGATION')}</LocaleText>
          </span>
        </div>
        <div className="product-evidence__query">
          <span className="product-evidence__mono">
            <LocaleText>{t(scenario === 'technology' ? 'RESEARCH INPUT' : 'QUERY')}</LocaleText>
          </span>
          <strong>{data.query}</strong>
          <span className="product-evidence__hint">
            <LocaleText>
              {t(data.hosts.length === 1 ? '{count} example host' : '{count} example hosts', {
                count: formatCount(data.hosts.length),
              })}
            </LocaleText>
          </span>
        </div>
        {mode === 'query' && (
          <div className="product-evidence__context-note">
            <span className="product-evidence__mono">
              <LocaleText>{t('STARTING POINT')}</LocaleText>
            </span>
            <p>
              <LocaleText>
                {t(
                  'Begin with a known {type}. The records below show how the investigation continues. Technology input illustrates intent, not verified query syntax.',
                  {
                    type: locale === 'en' ? data.label.toLowerCase() : t(data.label),
                  },
                )}
              </LocaleText>
            </p>
          </div>
        )}
        <div className="product-evidence__layout">
          <div className="product-evidence__results">
            <div className="product-evidence__eyebrow">
              <span>
                <LocaleText>{t('SEARCH RESULTS')}</LocaleText>
              </span>
              <span>
                <LocaleText>{t('SELECT A HOST')}</LocaleText>
              </span>
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
                  <small>
                    <LocaleText>{t(item.role)}</LocaleText>
                  </small>
                </span>
              </button>
            ))}
            {!compact && (
              <p className="product-evidence__disclaimer" id={id}>
                <LocaleText>{t(demoNotice)}</LocaleText>
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
              <span>
                <LocaleText>
                  {t(mode === 'services' ? 'SERVICES & TECHNOLOGIES' : 'HOST DETAILS')}
                </LocaleText>
              </span>
              <span>
                <LocaleText>{t('SELECTED')}</LocaleText>
              </span>
            </div>
            <h3>{host.ip}</h3>
            <p className="product-evidence__meta">{host.hostname}</p>
            {!compact && (
              <div className="product-evidence__properties">
                <div>
                  <span>
                    <LocaleText>{t('Evidence source')}</LocaleText>
                  </span>
                  <strong>
                    <LocaleText>{t('Example record')}</LocaleText>
                  </strong>
                </div>
                <div>
                  <span>
                    <LocaleText>{t('Observation time')}</LocaleText>
                  </span>
                  <strong>
                    <LocaleText>{t('No live observation')}</LocaleText>
                  </strong>
                </div>
              </div>
            )}
            <div className="product-evidence__services">
              <span className="product-evidence__mono">
                <LocaleText>{t('SERVICES & TECHNOLOGIES')}</LocaleText>
              </span>
              {host.services.map((service, index) => (
                <button
                  type="button"
                  className="product-evidence__service"
                  key={service.port}
                  aria-pressed={activeServiceIndex === index}
                  onClick={() => setServiceIndex(index)}
                >
                  <span className="product-evidence__port">
                    {service.port}
                    <small>/ tcp</small>
                  </span>
                  <strong>{service.protocol}</strong>
                  <span>
                    {service.technology}
                    {!compact && (
                      <small>
                        <LocaleText>{t(service.evidence)}</LocaleText>
                      </small>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="evidence-response" data-morph-enter>
              <span className="product-evidence__mono">
                <LocaleText>
                  {t('SERVICE EVIDENCE / {port} TCP', { port: service.port })}
                </LocaleText>
              </span>
              {banner.map((line) => (
                <code key={line}>{line}</code>
              ))}
              <span className="evidence-response__caption">
                <LocaleText>{t('Response banner · authored example')}</LocaleText>
              </span>
            </div>
            {(mode === 'cve' || scenario === 'technology') && (
              <div className="product-evidence__cve">
                <span className="product-evidence__mono">
                  <LocaleText>{t('CVE ASSOCIATIONS')}</LocaleText>
                </span>
                <dl>
                  <div>
                    <dt>
                      <LocaleText>{t('Detected product')}</LocaleText>
                    </dt>
                    <dd>{service.technology}</dd>
                  </div>
                  <div>
                    <dt>
                      <LocaleText>{t('Applicability')}</LocaleText>
                    </dt>
                    <dd>
                      <LocaleText>{t('Requires verification')}</LocaleText>
                    </dd>
                  </div>
                </dl>
                <p>
                  <LocaleText>
                    {t(
                      'No CVE is asserted for this example. Check the vendor advisory, affected versions, configuration and backported fixes before confirming a vulnerability.',
                    )}
                  </LocaleText>
                </p>
              </div>
            )}
            {mode === 'continue' && (
              <div className="product-evidence__next">
                <span className="product-evidence__mono">
                  <LocaleText>{t('NEXT RESEARCH LEAD')}</LocaleText>
                </span>
                <strong>{host.hostname}</strong>
                <p>
                  <LocaleText>{t(data.next)}</LocaleText>
                </p>
              </div>
            )}
          </div>
        </div>
        {showPlaybackStatus && (
          <div className="evidence-playback" aria-hidden="true">
            <span className="evidence-playback__dot" />
            <span data-playback-label>
              <LocaleText>{playbackCaption}</LocaleText>
            </span>
            <span className="evidence-playback__track">
              <i data-playback-progress />
            </span>
          </div>
        )}
        {!embedded && (
          <div className="product-evidence__footer">
            <span>
              {compact
                ? t(demoNotice)
                : t('Observation, detection, association: different levels of certainty.')}
            </span>
            <a href={productUrl + '/search'}>
              <LocaleText>{t('Open Apcosys Search')}</LocaleText>
            </a>
          </div>
        )}
        {compact && (
          <span className="sr-only" id={id}>
            {t(demoNotice)}
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
