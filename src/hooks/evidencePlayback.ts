import { createPlaybackClock, easeInOutCubic, playbackProgress } from '../lib/playback';

const phases = [
  ['.product-evidence__query strong', 'Read the query'],
  ['.product-evidence__result[aria-pressed="true"]', 'Select a matching host'],
  ['.product-evidence__service[aria-pressed="true"]', 'Inspect the observed service'],
  ['.evidence-response, .product-evidence__cve, .product-evidence__next', 'Follow the evidence'],
] as const;

/** Loaded only as the product preview approaches the viewport. */
export function mountEvidencePlayback(
  root: HTMLDivElement,
  paused: boolean,
  onCaption: (caption: string) => void,
) {
  const cursor = root.querySelector<HTMLElement>('.evidence-cursor');
  if (!cursor) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches;
  const progress = root.querySelector<HTMLElement>('[data-playback-progress]');
  const progressTransform = progress?.style.transform ?? '';
  const cursorStyle = {
    transform: cursor.style.transform,
    opacity: cursor.style.opacity,
    visibility: cursor.style.visibility,
  };
  const targets = phases.flatMap(([selector, caption], index) => {
    const element = root.querySelector<HTMLElement>(selector);
    return element
      ? [
          {
            element,
            caption,
            index,
            x: 0,
            y: 0,
          },
        ]
      : [];
  });
  const query = root.querySelector<HTMLElement>('.product-evidence__query strong');
  const typing = [
    ...(query ? [{ element: query, start: 0.3, duration: 1.15, steps: 20 }] : []),
    ...Array.from(
      root.querySelectorAll<HTMLElement>('.evidence-response code'),
      (element, index) => ({
        element,
        start: 6.9 + index * 0.18,
        duration: 0.9,
        steps: 24,
      }),
    ),
  ].map((item) => ({ ...item, clipPath: item.element.style.clipPath }));
  let visible = false;
  let hovering = root.matches(':hover');
  let focused = root.contains(document.activeElement);
  let disposed = false;
  let resizeFrame = 0;
  let caption = '';

  function restore() {
    Object.assign(cursor!.style, cursorStyle);
    if (progress) progress.style.transform = progressTransform;
    for (const { element, clipPath } of typing) element.style.clipPath = clipPath;
  }

  function revealText() {
    for (const { element } of typing) element.style.clipPath = 'none';
  }

  function measure() {
    const bounds = root.getBoundingClientRect();
    for (const target of targets) {
      const element = target.element.getBoundingClientRect();
      target.x = element.left - bounds.left + Math.min(target.element.clientWidth * 0.7, 190);
      target.y = element.top - bounds.top + Math.min(target.element.clientHeight * 0.55, 48);
    }
  }

  const clock = createPlaybackClock((elapsed) => {
    if (disposed || reduced) return;
    if (!root.isConnected || document.hidden) {
      clock.setPlaying(false);
      return;
    }
    if (paused || hovering || focused) return;
    // The cursor finishes fading at 8.9s; the reading pause lasts another 1.4s.
    const time = (elapsed / 1000) % 10.3;
    const phase = Math.min(3, Math.floor(time / 2.2));
    let previous = { x: 0, y: 0 };
    let position = previous;
    let scale = 1;
    let nextCaption = caption;
    for (const target of targets) {
      const start = target.index * 2.2;
      const local = time - start;
      if (target.index <= phase) {
        nextCaption = target.caption;
        const move = easeInOutCubic(playbackProgress(time, start + 0.1, 0.7));
        position = {
          x: previous.x + (target.x - previous.x) * move,
          y: previous.y + (target.y - previous.y) * move,
        };
        previous = target;
        const press = playbackProgress(time, start + 0.85, 0.12);
        const release = playbackProgress(time, start + 0.97, 0.12);
        scale = 1 - 0.12 * (local < 0.97 ? 1 - (1 - press) ** 2 : (1 - release) ** 2);
      }
    }
    if (caption !== nextCaption) {
      caption = nextCaption;
      // React owns localization; playback announces only the source key.
      onCaption(caption);
    }
    cursor.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
    const appearing = easeInOutCubic(playbackProgress(time, 0.1, 0.7));
    const disappearing = playbackProgress(time, 8.5, 0.4);
    cursor.style.opacity = String(time < 8.5 ? appearing : (1 - disappearing) ** 2);
    cursor.style.visibility = 'visible';
    if (progress) progress.style.transform = `scaleX(${playbackProgress(time, 0, 8.8)})`;
    for (const { element, start, duration, steps } of typing) {
      const fraction = Math.floor(playbackProgress(time, start, duration) * steps) / steps;
      element.style.clipPath =
        time < start || time >= start + duration ? 'none' : `inset(0 ${(1 - fraction) * 100}% 0 0)`;
    }
  });

  const sync = () => {
    if (disposed) return;
    if (reduced) {
      clock.reset();
      restore();
      return;
    }
    const interacting = hovering || focused;
    clock.setPlaying(!paused && visible && !document.hidden && !interacting && root.isConnected);
    cursor.style.visibility = interacting || paused ? 'hidden' : 'visible';
    if (interacting || paused) revealText();
  };
  const motionChanged = (event: MediaQueryListEvent) => {
    reduced = event.matches;
    sync();
  };
  const enter = () => {
    hovering = true;
    sync();
  };
  const leave = () => {
    hovering = false;
    sync();
  };
  const focus = () => {
    focused = true;
    sync();
  };
  const blur = (event: FocusEvent) => {
    focused = event.relatedTarget instanceof Node && root.contains(event.relatedTarget);
    sync();
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      sync();
    },
    { threshold: 0.15 },
  );
  observer.observe(root);
  const resize = new ResizeObserver(() => {
    if (resizeFrame || disposed) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (disposed) return;
      measure();
      clock.refresh();
    });
  });
  resize.observe(root);
  for (const { element } of targets) resize.observe(element);
  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', focus);
  root.addEventListener('focusout', blur);
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', motionChanged);
  measure();
  if (progress) progress.style.transform = 'scaleX(0)';
  sync();
  return () => {
    disposed = true;
    observer.disconnect();
    resize.disconnect();
    cancelAnimationFrame(resizeFrame);
    clock.dispose();
    root.removeEventListener('pointerenter', enter);
    root.removeEventListener('pointerleave', leave);
    root.removeEventListener('focusin', focus);
    root.removeEventListener('focusout', blur);
    document.removeEventListener('visibilitychange', sync);
    preference.removeEventListener('change', motionChanged);
    restore();
  };
}
