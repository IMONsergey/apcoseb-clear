import { DoubleButton } from './DoubleButton';
import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import './CookiePreferencesBody.css';

export function CookiePreferencesBody({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (result: 'saved' | 'unavailable') => void;
}) {
  const { t } = useLocale();
  return (
    <div className="stage-cookie-content">
      <p>
        <LocaleText>
          {t(
            'Essential browser storage supports the website theme and your saved preferences. No optional analytics or marketing trackers are enabled on this website.',
          )}
        </LocaleText>
      </p>
      <p>
        <LocaleText>
          {t(
            'These preferences apply only to this marketing website. They do not control storage in the separate Apcosys application.',
          )}
        </LocaleText>
      </p>
      <label className="stage-cookie-choice">
        <span>
          <strong>{t('Essential')}</strong>
          <small>{t('Required for site preferences')}</small>
        </span>
        <input type="checkbox" checked readOnly disabled />
      </label>
      <label className="stage-cookie-choice">
        <span>
          <strong>{t('Analytics')}</strong>
          <small>{t('Not enabled on this website')}</small>
        </span>
        <input type="checkbox" checked={false} readOnly disabled />
      </label>
      <p className="stage-helper">
        <LocaleText>{t('For the current legal policy, see')}</LocaleText>{' '}
        <a href={siteHref('/legal/cookie-policy')} onClick={onClose}>
          <LocaleText>{t('Cookie Policy')}</LocaleText>
        </a>
        .
      </p>
      <DoubleButton
        onClick={() => {
          let result: 'saved' | 'unavailable' = 'saved';
          try {
            localStorage.setItem('apcosys-cookie-preferences', 'essential');
          } catch {
            result = 'unavailable';
          }
          onSave(result);
        }}
      >
        <LocaleText>{t('Save Preferences')}</LocaleText>
      </DoubleButton>
    </div>
  );
}
