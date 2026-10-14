import '../../styles/theme-demos.css';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { ResearchScene } from '../../content/research';
import '../../visuals/product/product-scenes.js';

declare global {
  interface Window {
    ApcosysProductScenes?: { configure(options: { gsap: typeof gsap }): void };
  }
}
window.ApcosysProductScenes?.configure({ gsap });

export default function StepDemoMount({ scene }: { scene: ResearchScene }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!host.current) return;
    const element = document.createElement('apcosys-product-demo');
    element.setAttribute('scene', scene);
    element.setAttribute('fit', 'contain');
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
    host.current.append(element);
    return () => element.remove();
  }, [scene]);
  return <div ref={host} className="step-demo-host" aria-hidden="true" inert />;
}
