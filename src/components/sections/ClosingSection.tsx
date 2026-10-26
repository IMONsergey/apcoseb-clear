import { LocaleText } from '../../i18n/LocaleText';
import { productUrl } from '../../config/site';
import { useLocale } from '../../i18n/context';
import { DoubleButton } from '../ui/DoubleButton';
import { SearchChrome } from './SearchChrome';

export function ClosingSection() {
  const { t } = useLocale();
  return (
    <section className="closing-section" aria-labelledby="closing-heading">
      <div className="container">
        <div className="closing-scene closing-scene--live">
          <SearchChrome credits={500} />
          <div className="closing-copy">
            <h2 id="closing-heading">
              <LocaleText>{t('Start with your first query.')}</LocaleText>
            </h2>
            <p className="closing-copy__note">
              <LocaleText>{t('TRY THE PUBLIC SEARCH BEFORE CREATING AN ACCOUNT')}</LocaleText>
            </p>
            <DoubleButton href={`${productUrl}/search`} icon="external">
              <LocaleText>{t('Try free search')}</LocaleText>
            </DoubleButton>
          </div>
        </div>
      </div>
    </section>
  );
}
