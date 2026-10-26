import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { supportEmail, apiDocumentationPath } from '../../config/site';
import { siteHref } from '../../app/paths';
import { AnimatedDetails } from '../ui/AnimatedDetails';
import { httpApiMethodCosts, plans } from '../../content/plans';
import { formatCredits } from '../../lib/pricing';
export function FAQSection() {
  const { locale, t } = useLocale();
  return (
    <section className="faq-section section-space" id="faq" aria-labelledby="faq-title">
      <div className="container faq-grid">
        <h2 id="faq-title">
          <LocaleText>{t('Good questions.')}</LocaleText>
          <br />
          <LocaleText>{t('Clear answers.')}</LocaleText>
        </h2>
        <div className="faq-list">
          <AnimatedDetails title={t('How does the Free plan work?')} initialOpen>
            <p>
              <LocaleText>
                {t(
                  'Free includes {credits} credits for one person, with basic search for personal, non-commercial use. Plus adds API access, CVE context and bucket search.',
                  {
                    credits: formatCredits(
                      plans.find((plan) => plan.id === 'free')!.credits,
                      false,
                      locale,
                    ),
                  },
                )}
              </LocaleText>
            </p>
          </AnimatedDetails>
          <AnimatedDetails title={t('How do credits and API costs differ?')}>
            <p>
              <LocaleText>
                {t(
                  'Credits are the allowance listed on each plan. HTTP API methods have separate published costs: {search} for host search and {analytics} for host analytics. Those costs do not specify the debit in credits or Search Tokens.',
                  {
                    search: httpApiMethodCosts.hosts,
                    analytics: httpApiMethodCosts.analytics,
                  },
                )}
              </LocaleText>{' '}
              <a href={siteHref('/pricing') + '#usage-guide'}>
                <LocaleText>{t('Compare usage units and API costs')}</LocaleText>
              </a>
              .
            </p>
          </AnimatedDetails>
          <AnimatedDetails title={t('Can I use the API?')}>
            <p>
              <LocaleText>
                {t('API access is available on Plus, Expert and Business plans.')}
              </LocaleText>{' '}
              <a href={siteHref(apiDocumentationPath)}>
                <LocaleText>{t('View API documentation')}</LocaleText>
              </a>
              .
            </p>
          </AnimatedDetails>
          <AnimatedDetails title={t('How can I contact the team?')}>
            <p>
              <LocaleText>{t('Write to')}</LocaleText>
              {'\u00a0'}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>{' '}
              <LocaleText>{t('about your data, API or procurement needs.')}</LocaleText>
            </p>
          </AnimatedDetails>
        </div>
      </div>
    </section>
  );
}
