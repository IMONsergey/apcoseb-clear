import { useNearViewport } from '../../hooks/useNearViewport';
import '../sections/ApiSection.css';
import { Component, Suspense, lazy, useCallback, useRef, useState, type ReactNode } from 'react';
import { assetUrl } from '../../content/assets';
import { useLocale } from '../../i18n/context';

const Demo = lazy(() => import('./ApiDemoMount'));
class DemoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function ApiIllustration() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useNearViewport(ref, '280px');
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div
      ref={ref}
      className="api-demo-frame"
      data-ready={ready}
      role="img"
      aria-label={t(
        'Illustrative Apcosys API documentation with a request and response. See the current documentation for the live API.',
      )}
    >
      <div className="api-demo-poster" aria-hidden="true">
        <img
          className="api-demo-fallback"
          src={assetUrl('api', 'api-layers.webp')}
          srcSet={`${assetUrl('api', 'api-layers-360.webp')} 360w, ${assetUrl('api', 'api-layers-600.webp')} 600w, ${assetUrl('api', 'api-layers.webp')} 712w`}
          sizes="(max-width: 899px) calc(100vw - 64px), (max-width: 1199px) 57vw, (min-width: 1800px) 836px, calc((100vw - 168px) / 2)"
          width="712"
          height="554"
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </div>
      <DemoBoundary>
        <Suspense fallback={null}>{mounted && <Demo onReady={onReady} />}</Suspense>
      </DemoBoundary>
    </div>
  );
}
