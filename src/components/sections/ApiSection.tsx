import './ApiSection.css';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { siteHref } from '../../app/paths';
import { DoubleButton } from '../ui/DoubleButton';
import { Icon } from '../ui/Icon';
import { Visual } from '../visuals/Visual';
import { ApiIllustration } from '../visuals/ApiIllustration';
export function ApiSection() {
  const { locale, t } = useLocale();
  return (
    <section className="api-section" id="api" aria-labelledby="api-title">
      <Visual kind="dots" direction="right-to-left" budget="supporting" themeOverride="light" />
      <div className="container api-grid">
        <div className="api-copy">
          <h2 id="api-title">
            {locale === 'en' ? (
              <>
                <LocaleText>{t('Bring Apcosys')}</LocaleText>
                <br className="api-break" /> <LocaleText>{t('data into your')}</LocaleText>
                <br className="api-break" /> <LocaleText>{t('own tools.')}</LocaleText>
              </>
            ) : (
              <LocaleText>{t('Bring Apcosys data into your own tools.')}</LocaleText>
            )}
          </h2>
          <Icon name="focus" width="25" height="25" />
          <p>
            <LocaleText>
              {t(
                'Query Apcosys programmatically and work with the results in your scripts, pipelines and reports. API access is available on Plus, Expert and Business plans.',
              )}
            </LocaleText>
          </p>
          <DoubleButton variant="inverse" href={siteHref('/developers/api')}>
            <LocaleText>{t('Explore API')}</LocaleText>
          </DoubleButton>
        </div>
        <div className="api-visual">
          <ApiIllustration />
        </div>
      </div>
    </section>
  );
}
