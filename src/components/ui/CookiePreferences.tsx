import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { DoubleButton } from './DoubleButton';
import { siteHref } from '../../app/paths';

const key = 'apcosys-cookie-preferences';
export function CookiePreferences() {
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
        Cookie Preferences
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cookie Preferences">
        <div className="stage-cookie-content">
          <p>
            Essential browser storage supports the website theme and your saved preferences. No
            optional analytics or marketing trackers are enabled in this client preview.
          </p>
          <label className="stage-cookie-choice">
            <span>
              <strong>Essential</strong>
              <small>Required for site preferences</small>
            </span>
            <input type="checkbox" checked readOnly disabled />
          </label>
          <label className="stage-cookie-choice">
            <span>
              <strong>Analytics</strong>
              <small>Not installed in this preview</small>
            </span>
            <input type="checkbox" checked={false} readOnly disabled />
          </label>
          <p className="stage-helper">
            For the current legal policy, see{' '}
            <a href={siteHref('/legal/cookie-policy')} onClick={() => setOpen(false)}>
              Cookie Policy
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
            Save Preferences
          </DoubleButton>
          {saved && (
            <span className="sr-only" role="status">
              Cookie preferences saved.
            </span>
          )}
        </div>
      </Modal>
    </>
  );
}
