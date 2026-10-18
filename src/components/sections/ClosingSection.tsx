import { LocaleText } from '../../i18n/LocaleText';
import { productUrl } from '../../config/site';
import { assetVariantUrl, type AssetFile } from '../../content/assets';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLocale } from '../../i18n/context';
import { useTheme } from '../../theme/ThemeProvider';
import { DoubleButton } from '../ui/DoubleButton';

export function ClosingSection() {
  const compact = useMediaQuery('(max-width: 599px)');
  const { locale, t } = useLocale();
  const credits = new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale).format(500);
  const { theme } = useTheme();
  const themed = (name: AssetFile<'closing'>) => assetVariantUrl('closing', name, theme);
  return (
    <section className="closing-section" aria-label={t('Start your first query')}>
      <div className="container">
        <div className={`closing-scene${compact ? ' closing-scene--compact' : ''}`}>
          <picture>
            <source media="(max-width: 340px)" srcSet={themed('start-320.webp')} />
            <source media="(max-width: 375px)" srcSet={themed('start-360.webp')} />
            <source media="(max-width: 410px)" srcSet={themed('start-390.webp')} />
            <source media="(max-width: 599px)" srcSet={themed('start-430.webp')} />
            <source media="(max-width: 899px)" srcSet={themed('start-768.webp')} />
            <source media="(max-width: 1199px)" srcSet={themed('start-1024.webp')} />
            <img
              src={themed('start-desktop.webp')}
              width="2880"
              height="1894"
              alt={
                compact
                  ? ''
                  : t(
                      'Start with your first query. Try the public search before creating an account.',
                    )
              }
              loading="lazy"
              decoding="async"
            />
          </picture>
          {compact && (
            <div className="closing-account" aria-hidden="true">
              <span>
                <LocaleText>{t('Credits:')}</LocaleText> <b>{credits}</b>
              </span>
              <span className="closing-account__upgrade">
                <LocaleText>{t('Upgrade Plan')}</LocaleText>
              </span>
            </div>
          )}
          {compact ? (
            <div className="closing-copy">
              <h3>
                <LocaleText>{t('Start with your first query.')}</LocaleText>
              </h3>
              <p className="closing-copy__note">
                <LocaleText>{t('TRY THE PUBLIC SEARCH BEFORE CREATING AN ACCOUNT')}</LocaleText>
              </p>
              <DoubleButton href={`${productUrl}/search`} icon="external">
                <LocaleText>{t('Try free search')}</LocaleText>
              </DoubleButton>
            </div>
          ) : (
            <>
              <span className="closing-cta-mask" aria-hidden="true" />
              <DoubleButton
                href={`${productUrl}/search`}
                icon="external"
                className="closing-hotspot closing-hotspot--button"
              >
                <LocaleText>{t('Try free search')}</LocaleText>
              </DoubleButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
