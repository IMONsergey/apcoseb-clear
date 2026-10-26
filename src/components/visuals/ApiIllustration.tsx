import { useNearViewport } from '../../hooks/useNearViewport';
import '../sections/ApiSection.css';
import { useRef } from 'react';
import { useApplicationPlayback } from '../../hooks/useApplicationPlayback';
import { useLocale } from '../../i18n/context';
import { ApplicationFrame } from './application/ApplicationFrame';
import { ApplicationApiScene } from './application/ApplicationApiScene';

export function ApiIllustration() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mounted = useNearViewport(ref, '280px');
  useApplicationPlayback(frameRef, 'api', mounted);
  return (
    <div ref={ref} className="api-illustration">
      <div
        className="api-demo-frame"
        role="img"
        aria-label={t('API workspace with a masked key, credit balances and account limits.')}
      >
        <ApplicationFrame scene="api" frameRef={frameRef}>
          <ApplicationApiScene />
        </ApplicationFrame>
      </div>
    </div>
  );
}
