import { useNearViewport } from '../../hooks/useNearViewport';
import { Component, Suspense, lazy, useRef, type ReactNode } from 'react';
import { type ResearchPoster, type ResearchScene } from '../../content/research';
import { assetVariantUrl } from '../../content/assets';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocale } from '../../i18n/context';

const Demo = lazy(() => import('./StepDemoMount'));
const posterWidths: Record<ResearchPoster, number> = {
  'step-query.webp': 908,
  'step-results.webp': 1234,
  'step-host.webp': 1164,
};

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** One shared lazy chunk; only illustrations approaching the viewport are mounted. */
export function StepIllustration({
  scene,
  image,
  alt,
}: {
  scene: ResearchScene;
  image: ResearchPoster;
  alt: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useNearViewport(ref, '240px');
  const { theme } = useTheme();
  const { t } = useLocale();

  return (
    <div ref={ref} className="step-illustration" role="img" aria-label={t(alt)}>
      <img
        src={assetVariantUrl('walkthrough', image, theme)}
        srcSet={([360, 600] as const)
          .map((width) => `${assetVariantUrl('walkthrough', image, theme, width)} ${width}w`)
          .concat(`${assetVariantUrl('walkthrough', image, theme)} ${posterWidths[image]}w`)
          .join(', ')}
        sizes="(max-width: 599px) calc(100vw - 108px), (max-width: 1199px) calc((100vw - 120px) / 2), (min-width: 1800px) 522px, calc((100vw - 220px) / 3)"
        width="908"
        height="609"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <SceneBoundary>
        <Suspense fallback={null}>
          {mounted && <Demo key={`${scene}-${theme}`} scene={scene} />}
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
