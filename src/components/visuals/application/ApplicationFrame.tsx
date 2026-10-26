import type { ReactNode, RefObject } from 'react';
import type { ResearchScene } from '../../../content/research';
import './application-scene.css';

export type ApplicationScene = ResearchScene | 'api';

/** A responsive excerpt of the application, with readable HTML before animation loads. */
export function ApplicationFrame({
  scene,
  frameRef,
  children,
}: {
  scene: ApplicationScene;
  frameRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={frameRef}
      className="application-scene"
      data-scene={scene}
      data-demo-playback="static"
      data-demo-phase="0"
      aria-hidden="true"
      inert
    >
      {children}
      <span className="application-demo-cursor" />
    </div>
  );
}
