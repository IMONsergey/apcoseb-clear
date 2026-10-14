import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { supportEmail } from '../../config/site';
import { apiDocumentationUrl } from '../../config/site';
import { siteHref } from '../../app/paths';
import { AnimatedDetails } from '../ui/AnimatedDetails';
export function FAQSection() {
  const { t } = useLocale();
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
                  'The existing Free plan introduces the service for personal, non-commercial use.',
                )}
              </LocaleText>
            </p>
          </AnimatedDetails>
          <AnimatedDetails title={t('What consumes search credits?')}>
            <p>
              <LocaleText>{t('For the current credit usage rules,')}</LocaleText>{' '}
              <a href={`mailto:${supportEmail}?subject=Apcosys%20search%20credits`}>
                <LocaleText>{t('contact our team')}</LocaleText>
              </a>
              .
            </p>
          </AnimatedDetails>
          <AnimatedDetails title={t('Can I use the API?')}>
            <p>
              <LocaleText>
                {t('API access is available on Plus, Expert and Business plans.')}
              </LocaleText>{' '}
              <a href={apiDocumentationUrl ?? siteHref('/developers/api') + '#documentation'}>
                <LocaleText>
                  {t(
                    apiDocumentationUrl
                      ? 'View API documentation'
                      : 'Read API integration guidance',
                  )}
                </LocaleText>
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
