import { useNearViewport } from '../../hooks/useNearViewport';
import { useRef } from 'react';
import { useApplicationPlayback } from '../../hooks/useApplicationPlayback';
import type { ResearchScene } from '../../content/research';
import { useLocale } from '../../i18n/context';
import { ApplicationFrame } from './application/ApplicationFrame';
import { ApplicationProductScene } from './application/ApplicationProductScene';

export function StepIllustration({ scene, alt }: { scene: ResearchScene; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mounted = useNearViewport(ref, '240px');
  const { t } = useLocale();
  useApplicationPlayback(frameRef, scene, mounted);
  return (
    <div ref={ref} className="step-illustration" role="img" aria-label={t(alt)}>
      <ApplicationFrame scene={scene} frameRef={frameRef}>
        <ApplicationProductScene scene={scene} />
      </ApplicationFrame>
    </div>
  );
}
