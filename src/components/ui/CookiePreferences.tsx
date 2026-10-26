import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { DoubleButton } from './DoubleButton';
import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

const key = 'apcosys-cookie-preferences';
export function CookiePreferences() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    function launch() {
      setOpen(true);
    }
    window.addEventListener('apcosys:cookie-preferences', launch);
    return () => window.removeEventListener('apcosys:cookie-preferences', launch);
  }, []);
  return (
    <>
      <button type="button" className="footer-cookie-trigger" onClick={() => setOpen(true)}>
        <LocaleText>{t('Cookie Preferences')}</LocaleText>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('Cookie Preferences')}>
        <div className="stage-cookie-content">
          <p>
            <LocaleText>
              {t(
                'Essential browser storage supports the website theme and your saved preferences. No optional analytics or marketing trackers are enabled on this website.',
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
            <a href={siteHref('/legal/cookie-policy')} onClick={() => setOpen(false)}>
              <LocaleText>{t('Cookie Policy')}</LocaleText>
            </a>
            .
          </p>
          <DoubleButton
            onClick={() => {
              try {
                localStorage.setItem(key, 'essential');
              } catch {
                /* Storage may be disabled. */
              }
              setSaved(true);
              setOpen(false);
            }}
          >
            <LocaleText>{t('Save Preferences')}</LocaleText>
          </DoubleButton>
          {saved && (
            <span className="sr-only" role="status">
              {t('Cookie preferences saved.')}
            </span>
          )}
        </div>
      </Modal>
    </>
  );
}
