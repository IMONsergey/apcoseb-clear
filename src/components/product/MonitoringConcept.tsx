import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { useState, useRef, useEffect } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { siteHref } from '../../app/paths';
import { demoHosts } from '../../content/product-demo';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
const views = [
  {
    id: 'scope',
    label: 'Scope',
    headline: 'Choose what to observe.',
    detail: 'Begin with infrastructure you own or are authorised to assess.',
  },
  {
    id: 'observations',
    label: 'Observe',
    headline: 'Compare recorded observations.',
    detail: 'Compare two recorded snapshots of the selected host.',
  },
  {
    id: 'change',
    label: 'Signal',
    headline: 'Review a possible change.',
    detail:
      'A service appearing in a later snapshot deserves investigation. A difference alone does not prove an incident.',
  },
  {
    id: 'context',
    label: 'Context',
    headline: 'Inspect the technical evidence.',
    detail: 'Read the service response and detected technology before interpreting a signal.',
  },
  {
    id: 'investigate',
    label: 'Investigate',
    headline: 'Continue the investigation.',
    detail: 'Carry the selected host into Search & Investigation and validate the observation.',
  },
];
export function MonitoringConcept() {
  const { locale, t } = useLocale();
  const count = new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale);
  const [current, setCurrent] = useState(0);
  const [assetIndex, setAssetIndex] = useState(0);
  const nav = useRef<HTMLDivElement>(null);
  const view = views[current]!;
  const asset = demoHosts[assetIndex]!;
  const service = asset.services[1]!;
  const response =
    service.protocol === 'SSH'
      ? 'SSH-2.0-OpenSSH_9.6'
      : 'HTTP/1.1 301 Moved Permanently\nLocation: https://' + asset.hostname;
  useEffect(() => {
    const el = nav.current;
    const active = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !active || el.scrollWidth <= el.clientWidth) return;
    const a = active.getBoundingClientRect(),
      n = el.getBoundingClientRect();
    if (a.right > n.right) el.scrollLeft += a.right - n.right;
    else if (a.left < n.left) el.scrollLeft -= n.left - a.left;
  }, [current]);
  return (
    <section
      id="monitoring-workflow"
      className="stage-monitor-concept section-space"
      aria-labelledby="monitor-concept-title"
    >
      <div className="container">
        <div className="stage-monitor-concept__heading">
          <div>
            <Text as="h2" id="monitor-concept-title">
              An observation is a starting point.
            </Text>
          </div>
          <Text as="p">Compare observations and investigate changes.</Text>
        </div>
        <div className="stage-monitor-console">
          <div className="stage-monitor-console__body">
            <div className="stage-monitor-console__sidebar" ref={nav}>
              {views.map((item, i) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCurrent(i)}
                  aria-pressed={i === current}
                  className="stage-monitor-console__nav"
                >
                  <LocaleText>{t(item.label)}</LocaleText>
                </button>
              ))}
            </div>
            <MorphPanel>
              <div className="stage-monitor-console__main">
                <div className="stage-monitor-assets">
                  <div className="stage-monitor-assets__list">
                    {demoHosts.map((host, i) => (
                      <button
                        type="button"
                        key={host.ip}
                        aria-pressed={assetIndex === i}
                        onClick={() => setAssetIndex(i)}
                      >
                        <span>
                          <strong>{t(host.role)}</strong>
                          <small>{host.hostname}</small>
                        </span>
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="m5 10 3 3 7-7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="stage-monitor-console__workspace">
                  <div className="stage-monitor-console__guide">
                    <Text as="h3" data-morph-enter>
                      {view.headline}
                    </Text>
                    <Text as="p">{view.detail}</Text>
                    <a
                      className="stage-monitor-console__link"
                      href={
                        siteHref('/platform/search-investigation') +
                        '?demoHost=' +
                        encodeURIComponent(asset.ip)
                      }
                    >
                      <LocaleText>{t('Explore Search & Investigation')}</LocaleText>
                      <Icon name="external" />
                    </a>
                  </div>
                  <div className="stage-monitor-console__evidence" aria-live="polite">
                    <div className="stage-monitor-assets__details">
                      <span>{t('Selected example')}</span>
                      <strong>{asset.ip}</strong>
                      <code>{asset.hostname}</code>
                    </div>
                    {current <= 1 ? (
                      <div className="stage-monitor-console__summary">
                        <div>
                          <span>
                            {t(current === 0 ? 'Authorised scope' : 'Snapshot A / earlier')}
                          </span>
                          <strong>{current === 0 ? 'example.com' : '443 / HTTPS'}</strong>
                          <Text as="p">
                            {current === 0
                              ? 'Confirm permission before observing.'
                              : 'nginx 1.24.0 · HTTP Server header'}
                          </Text>
                        </div>
                        <div>
                          <span>
                            {t(current === 0 ? 'Objects to review' : 'Snapshot B / later')}
                          </span>
                          <strong>
                            {current === 0
                              ? t('{count} service records', {
                                  count: count.format(asset.services.length),
                                })
                              : '443 / HTTPS + ' + service.port + ' / ' + service.protocol}
                          </strong>
                          <Text as="p">
                            {current === 0
                              ? asset.services
                                  .map((item) => item.port + ' / ' + item.protocol)
                                  .join(' · ')
                              : t('Added in this example: {technology}', {
                                  technology: service.technology,
                                })}
                          </Text>
                        </div>
                      </div>
                    ) : (
                      <div className="monitor-context" data-morph-enter>
                        <Text as="h4">
                          {current === 4
                            ? 'Create the next research task.'
                            : 'Inspect the changed service.'}
                        </Text>
                        <dl>
                          <div>
                            <dt>{t('Changed service')}</dt>
                            <dd>
                              {service.port} / {service.protocol}
                            </dd>
                          </div>
                          <div>
                            <dt>{t('Technology')}</dt>
                            <dd>{service.technology}</dd>
                          </div>
                          <div>
                            <dt>{t('Evidence source')}</dt>
                            <dd>{t(service.evidence)}</dd>
                          </div>
                        </dl>
                        {current === 3 && <pre>{response}</pre>}
                        {current === 4 && (
                          <Text as="p">
                            {
                              'Continue with the selected host in Search & Investigation. Keep the observation context with the task.'
                            }
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </MorphPanel>
          </div>
        </div>
      </div>
    </section>
  );
}
