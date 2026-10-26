import { observeViewportActivity } from '../../lib/visibility';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { useEffect, useRef, useState } from 'react';

/** Editorial proof layer: no implied customer or partner endorsements. */
const researchTopics = [
  'Host research',
  'Domain observations',
  'Technology context',
  'CVE associations',
  'Service discovery',
  'API access',
] as const;
export function TrustMarquee() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    return observeViewportActivity(ref.current, setRunning);
  }, []);
  return (
    <div className="container trust" ref={ref} data-running={running}>
      <p>
        <LocaleText>{t('A closer look at internet infrastructure')}</LocaleText>
      </p>
      <div className="trust-viewport" tabIndex={0} role="region" aria-label={t('Research areas')}>
        <div className="trust-track">
          {[0, 1].map((copy) => (
            <ul className="trust-group" key={copy} aria-hidden={copy === 1 || undefined}>
              {researchTopics.map((name) => (
                <li key={name}>
                  <span className="trust-mark stage-trust-topic">
                    <LocaleText>{t(name)}</LocaleText>
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
