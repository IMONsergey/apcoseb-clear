import { Text } from '../ui/Text';
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
    detail:
      'Begin with infrastructure you own or are authorised to assess. Select an example target below.',
  },
  {
    id: 'observations',
    label: 'Observe',
    headline: 'Compare recorded observations.',
    detail: 'Two authored snapshots show how a service difference can become a research lead.',
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
          <Text as="p">
            Explore a potential monitoring workflow with synthetic snapshots. This concept does not
            connect to live scans or alerts.
          </Text>
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
                <Text as="h3" data-morph-enter>
                  {view.headline}
                </Text>
                <Text as="p">{view.detail}</Text>
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
                          <strong>
                            <LocaleText>{t(host.role)}</LocaleText>
                          </strong>
                          <small>{host.ip}</small>
                        </span>
                        <span>
                          <LocaleText>{t(assetIndex === i ? 'Selected' : 'Select')}</LocaleText>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="stage-monitor-assets__details" aria-live="polite">
                    <span>
                      <LocaleText>{t('Selected example')}</LocaleText>
                    </span>
                    <strong>{asset.ip}</strong>
                    <div>
                      <span>
                        <LocaleText>{t('Hostname')}</LocaleText>
                      </span>
                      <span>{asset.hostname}</span>
                    </div>
                    <div>
                      <span>
                        <LocaleText>{t('Snapshot source')}</LocaleText>
                      </span>
                      <span>
                        <LocaleText>{t('Authored concept · no scan date')}</LocaleText>
                      </span>
                    </div>
                  </div>
                </div>
                {current <= 2 ? (
                  <div className="stage-monitor-console__summary" aria-live="polite">
                    <div>
                      <span>
                        <LocaleText>
                          {t(current === 0 ? 'Authorised scope' : 'Snapshot A / earlier')}
                        </LocaleText>
                      </span>
                      <strong>{current === 0 ? asset.hostname : '443 / HTTPS'}</strong>
                      <Text as="p">
                        {current === 0
                          ? 'Confirm permission before observing.'
                          : 'nginx 1.24.0 · HTTP Server header'}
                      </Text>
                    </div>
                    <div>
                      <span>
                        <LocaleText>
                          {t(current === 0 ? 'Objects to review' : 'Snapshot B / later')}
                        </LocaleText>
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
                          ? t(asset.role)
                          : t('Added in this example: {technology}', {
                              technology: service.technology,
                            })}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="monitor-context" data-morph-enter>
                    <Text as="h4">
                      {current === 3
                        ? 'Inspect the changed service.'
                        : 'Create the next research task.'}
                    </Text>
                    <dl>
                      <div>
                        <dt>
                          <LocaleText>{t('Host')}</LocaleText>
                        </dt>
                        <dd>{asset.hostname}</dd>
                      </div>
                      <div>
                        <dt>
                          <LocaleText>{t('Changed service')}</LocaleText>
                        </dt>
                        <dd>
                          {service.port} / {service.protocol}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          <LocaleText>{t('Technology')}</LocaleText>
                        </dt>
                        <dd>{service.technology}</dd>
                      </div>
                    </dl>
                    <Text as="p">
                      {current === 3
                        ? 'Review the response and validate the observation before treating a change as a security finding.'
                        : 'Continue with the selected host in Search & Investigation. Keep the observation context with the task.'}
                    </Text>
                  </div>
                )}
                <a
                  className="stage-monitor-console__link"
                  href={
                    siteHref('/platform/search-investigation') +
                    '?demoHost=' +
                    encodeURIComponent(asset.ip)
                  }
                >
                  <LocaleText>{t('Explore Search & Investigation')}</LocaleText>
                </a>
              </div>
            </MorphPanel>
          </div>
          <div className="stage-monitor-console__footer">
            <LocaleText>
              {t('Concept only · NO LIVE ALERTS · Illustrative service records')}
            </LocaleText>
          </div>
        </div>
      </div>
    </section>
  );
}
