import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { DoubleButton } from './DoubleButton';
import { Icon } from './Icon';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

export function CookiePreferences() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [Body, setBody] = useState<
    typeof import('./CookiePreferencesBody').CookiePreferencesBody | null
  >(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    if (!open || Body) return;
    let active = true;
    import('./CookiePreferencesBody').then(
      ({ CookiePreferencesBody }) => {
        if (active) setBody(() => CookiePreferencesBody);
      },
      () => {
        if (active) setLoadFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [open, Body]);
  const [feedback, setFeedback] = useState<'saved' | 'unavailable' | null>(null);
  const pendingFeedback = useRef<'saved' | 'unavailable' | null>(null);
  useEffect(() => {
    function launch() {
      pendingFeedback.current = null;
      setFeedback(null);
      setLoadFailed(false);
      setOpen(true);
    }
    window.addEventListener('apcosys:cookie-preferences', launch);
    return () => window.removeEventListener('apcosys:cookie-preferences', launch);
  }, []);
  return (
    <>
      <button
        type="button"
        className="footer-cookie-trigger"
        onClick={() => {
          pendingFeedback.current = null;
          setFeedback(null);
          setLoadFailed(false);
          setOpen(true);
        }}
      >
        <LocaleText>{t('Cookie Preferences')}</LocaleText>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        onAfterClose={() => {
          // Announce only after the native modal has released its inert background.
          const result = pendingFeedback.current;
          pendingFeedback.current = null;
          if (result) setFeedback(result);
        }}
        title={t('Cookie Preferences')}
      >
        {Body ? (
          <Body
            onClose={() => setOpen(false)}
            onSave={(result) => {
              pendingFeedback.current = result;
              setOpen(false);
            }}
          />
        ) : loadFailed ? (
          <>
            <p role="alert">{t('Cookie preferences could not load.')}</p>
            <p>{t('Check your connection and reload the page to try again.')}</p>
            <DoubleButton onClick={() => window.location.reload()}>
              <LocaleText>{t('Reload page')}</LocaleText>
            </DoubleButton>
          </>
        ) : (
          <p role="status">{t('Loading cookie preferences…')}</p>
        )}
      </Modal>
      <div className="cookie-feedback" data-visible={feedback !== null}>
        <p className="cookie-feedback__message" role="status" aria-live="polite" aria-atomic="true">
          {feedback === 'saved'
            ? t('Cookie preferences saved.')
            : feedback === 'unavailable'
              ? t(
                  'Your browser could not save this preference. Optional trackers remain disabled on this website.',
                )
              : ''}
        </p>
        {feedback && (
          <button
            type="button"
            className="icon-button"
            aria-label={t('Dismiss notification')}
            onClick={() => setFeedback(null)}
          >
            <Icon name="close" />
          </button>
        )}
      </div>
    </>
  );
}
