import { businessPlan } from '../../content/plans';
import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { DoubleButton } from '../ui/DoubleButton';
import { Visual } from '../visuals/Visual';
export function AudienceSection() {
  const { locale, t } = useLocale();
  const users = new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale).format(
    businessPlan.users,
  );
  return (
    <section id="audiences" className="audiences section-space" aria-labelledby="audiences-title">
      <div className="container">
        <h2 id="audiences-title">
          {locale === 'en' ? (
            <>
              <LocaleText>{t('For security researchers')}</LocaleText>
              <br />
              <LocaleText>{t('and teams.')}</LocaleText>
            </>
          ) : (
            <LocaleText>{t('For security researchers and teams.')}</LocaleText>
          )}
        </h2>
        <div className="audience-grid">
          <article id="researchers" className="audience-card">
            <div className="audience-art">
              <Visual kind="rings" eager />
            </div>
            <div className="audience-copy">
              <h3>
                <LocaleText className="locale-text--lines">
                  {t(locale === 'en' ? 'For security\nresearchers' : 'For security researchers')}
                </LocaleText>
              </h3>
              <p>
                <LocaleText>
                  {t(
                    'Find the infrastructure you are interested in, check what runs on it and keep investigating.',
                  )}
                </LocaleText>
              </p>
              <ul className="use-case-tags">
                <li>
                  <a href={siteHref('/use-cases/bug-bounty')}>
                    <LocaleText>{t('Bug Bounty')}</LocaleText>
                  </a>
                </li>
                <li>
                  <a href={siteHref('/use-cases/vulnerability-research')}>
                    <LocaleText>{t('Vulnerability Research')}</LocaleText>
                  </a>
                </li>
                <li>
                  <a href={siteHref('/use-cases/osint-threat-investigation')}>
                    <LocaleText>{t('OSINT / Threat Investigation')}</LocaleText>
                  </a>
                </li>
              </ul>
            </div>
            <div className="audience-actions">
              <DoubleButton href={siteHref('/platform/search-investigation')}>
                <LocaleText>{t('Explore Search & Investigation')}</LocaleText>
              </DoubleButton>
              <DoubleButton variant="secondary" href={siteHref('/pricing')}>
                <LocaleText>{t('View Plans')}</LocaleText>
              </DoubleButton>
            </div>
          </article>
          <article id="teams" className="audience-card">
            <div className="audience-art">
              <Visual kind="rosette" eager />
            </div>
            <div className="audience-copy">
              <h3>
                <LocaleText className="locale-text--lines">
                  {t(locale === 'en' ? 'For security\nteams' : 'For security teams')}
                </LocaleText>
              </h3>
              <p>
                <LocaleText>
                  {t(
                    'Investigate the internet-facing infrastructure your organisation runs, review its technical context and bring the results into your own tools through the API. The Business plan gives up to {users} users access on one subscription.',
                    { users },
                  )}
                </LocaleText>
              </p>
            </div>
            <div className="audience-actions">
              <DoubleButton href={siteHref('/teams')}>
                <LocaleText>{t('Explore For Teams')}</LocaleText>
              </DoubleButton>
              <DoubleButton variant="secondary" href={siteHref('/pricing')}>
                <LocaleText>{t('View Business Plan')}</LocaleText>
              </DoubleButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
