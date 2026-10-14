import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { noBreakNumber } from '../../i18n/typography';
import { assetUrl } from '../../content/assets';
import { Logo } from '../ui/Logo';
import { Icon, type IconName } from '../ui/Icon';

const previewIcons: IconName[] = ['search', 'database', 'scanner', 'cube', 'book', 'bookmark'];

/** Decorative product chrome: search below it is a real native form. */
export function SearchChrome({ credits = '2 000' }: { credits?: string }) {
  const { t } = useLocale();
  return (
    <div className="search-chrome" aria-hidden="true">
      <div className="search-chrome__surface" />
      <div className="search-chrome__mobile-brand">
        <Logo />
        <Icon name="menu" />
      </div>
      <div className="search-chrome__rail">
        <img src={assetUrl('brand', 'favicon.svg')} width="26" height="26" alt="" />
        {previewIcons.map((name, index) => (
          <span key={name} className={index === 0 ? 'is-selected' : undefined}>
            <Icon name={name} />
          </span>
        ))}
      </div>
      <div className="search-chrome__filters">
        <span>
          <LocaleText>{t('Add Filter')}</LocaleText> <Icon name="plus" />
        </span>
        <span>
          <LocaleText>{t('All Types')}</LocaleText> <Icon name="chevron" />
        </span>
      </div>
      <div className="search-chrome__account">
        <span>
          <LocaleText>{t('Credits:')}</LocaleText> <b>{noBreakNumber(credits)}</b>
        </span>
        <span className="search-chrome__upgrade">
          <LocaleText>{t('Upgrade Plan')}</LocaleText>
        </span>
      </div>
    </div>
  );
}
