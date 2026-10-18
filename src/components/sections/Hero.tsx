import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { DoubleButton } from '../ui/DoubleButton';
import { productUrl } from '../../config/site';
export function Hero() {
  const { locale, t } = useLocale();
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <h1 id="hero-title">
          <span className="hero-title__line">
            <LocaleText>{t('Start with a query.')}</LocaleText>
          </span>{' '}
          <span className="hero-title__line">
            <LocaleText>{t('Follow what you find.')}</LocaleText>
          </span>
        </h1>
        <div className="hero-bottom">
          <p className="lead">
            {locale === 'en' ? (
              <>
                <LocaleText>
                  {t(
                    'Search internet-facing hosts by IP, domain, port, service or technology, see what runs on them and',
                  )}
                </LocaleText>
                {'\u00a0'}
                <mark>
                  <LocaleText>{t('refine your search as you go.')}</LocaleText>
                </mark>
              </>
            ) : (
              <LocaleText>
                {t(
                  'Search internet-facing hosts by IP, domain, port, service or technology, see what runs on them and refine your search as you go.',
                )}
              </LocaleText>
            )}
          </p>
          <div className="hero-actions">
            <DoubleButton href={`${productUrl}/search`}>
              <LocaleText>{t('Try free search')}</LocaleText>
            </DoubleButton>
            <DoubleButton href="#how-it-works" variant="secondary" icon="down">
              <LocaleText>{t('See how it works')}</LocaleText>
            </DoubleButton>
          </div>
        </div>
      </div>
    </section>
  );
}
