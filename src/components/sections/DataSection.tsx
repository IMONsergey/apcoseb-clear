import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
const observations = [
  { id: 'ipv4', label: 'SERVICE RESPONSE', value: '443 / HTTPS', note: 'What a host returned' },
  { id: 'ipv6', label: 'TECHNOLOGY', value: 'nginx 1.24.0', note: 'Detected, not verified' },
  { id: 'domains', label: 'TIME CONTEXT', value: 'A snapshot', note: 'Not a live guarantee' },
  {
    id: 'products',
    label: 'COLLECTION',
    value: 'Public services',
    note: 'Responses become records',
  },
  { id: 'cves', label: 'CVE ASSOCIATIONS', value: 'Research leads', note: 'Verify applicability' },
  { id: 'protocols', label: 'COVERAGE', value: 'Has limits', note: 'Absence is not proof' },
] as const;
import { DoubleButton } from '../ui/DoubleButton';
import { Visual } from '../visuals/Visual';

/** One set of metrics; CSS changes the mobile reading path without duplicating data. */
export function DataSection() {
  const { locale, t } = useLocale();
  return (
    <section
      className="data-section data-section--observations"
      id="data"
      aria-labelledby="data-title"
    >
      <div className="container data-stage">
        <div className="data-copy">
          <h2 id="data-title">
            {locale === 'en' ? (
              <>
                <LocaleText>{t('The data behind')}</LocaleText>
                <br />
                <LocaleText>{t('every search.')}</LocaleText>
              </>
            ) : (
              <LocaleText>{t('The data behind every search.')}</LocaleText>
            )}
          </h2>
          <p>
            <LocaleText>
              {t(
                'A response is an observation. A product version is a detection. A CVE association is a lead to verify. Read each result with its collection and time context.',
              )}
            </LocaleText>
          </p>
        </div>
        <div className="data-visual-field">
          <Visual kind="globe" />
          <dl className="data-metrics">
            {observations.map((metric) => (
              <div className={`metric-card metric-card--${metric.id}`} key={metric.id}>
                <dt>
                  <span>
                    <LocaleText>{t(metric.label)}</LocaleText>
                  </span>
                </dt>
                <dd>
                  <LocaleText>{t(metric.value)}</LocaleText>
                </dd>
                <dd className="metric-observation-note">
                  <LocaleText>{t(metric.note)}</LocaleText>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="data-actions">
          <DoubleButton href={siteHref('/platform/data-methodology')} variant="dark">
            <LocaleText>{t('Read methodology')}</LocaleText>
          </DoubleButton>
          <DoubleButton href={siteHref('/responsible-scanning')} variant="inverse">
            <LocaleText>{t('How we scan')}</LocaleText>
          </DoubleButton>
        </div>
      </div>
    </section>
  );
}
