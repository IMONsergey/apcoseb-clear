import { createPlaybackClock, easeInOutCubic, playbackProgress } from '../../../lib/playback';
import type { ApplicationScene } from './ApplicationFrame';

const targets: Record<ApplicationScene, readonly string[]> = {
  query: ['query-input', 'query-submit', 'query-examples', 'query-examples'],
  results: ['query-filters', 'country-filter', 'filter-apply', 'result-first'],
  host: ['host-address', 'host-services', 'host-response', 'host-product'],
  evidence: ['tls-service', 'tls-identity', 'tls-validity', 'tls-names'],
  suggestions: ['refine-condition', 'refine-applied', 'query-submit', 'result-first'],
  api: ['api-key', 'api-copy', 'api-usage', 'api-limits'],
};

// Keep the pointer on the relevant item without painting a focus rectangle around it.
const cursorTargets: Readonly<Record<string, string>> = {
  'country-filter': '.application-facet--de',
  'host-address': 'strong',
  'host-services': '[data-selected="true"]',
  'refine-applied': ':scope > span:first-child',
};

/** Native playback decorates the complete, translated HTML without owning its layout. */
export function startApplicationPlayback(root: HTMLElement, scene: ApplicationScene) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  // The change event owns this state and restores the static frame before rendering stops.
  let reduced = preference.matches;
  const cursor = root.querySelector<HTMLElement>('.application-demo-cursor');
  const cursorStyle = cursor && {
    transform: cursor.style.transform,
    opacity: cursor.style.opacity,
    visibility: cursor.style.visibility,
  };
  const query = root.querySelector<HTMLElement>('[data-demo-query]');
  const queryText = query?.textContent ?? '';
  const pointerTargets = targets[scene].flatMap((name, index) => {
    const element = root.querySelector<HTMLElement>(`[data-demo-target="${name}"]`);
    if (!element) return [];
    const selector = cursorTargets[name];
    const cursorElement = selector ? element.querySelector<HTMLElement>(selector) : element;
    return [
      {
        element,
        cursorElement: cursorElement ?? element,
        index,
        x: 0,
        y: 0,
      },
    ];
  });
  let visible = false;
  let disposed = false;
  let resizeFrame = 0;
  let previousPhase = -1;
  let previousAction = -2;
  let paused = false;

  function restore() {
    if (cursor && cursorStyle) Object.assign(cursor.style, cursorStyle);
    root.dataset.demoPhase = '0';
    delete root.dataset.demoAction;
    delete root.dataset.demoFilter;
    delete root.dataset.demoCopied;
    delete root.dataset.apiView;
    previousPhase = -1;
    previousAction = -2;
    if (query) query.textContent = queryText;
  }

  function measure() {
    const bounds = root.getBoundingClientRect();
    let lastVisible = { x: bounds.width / 2, y: bounds.height / 2 };
    for (const target of pointerTargets) {
      const element = target.cursorElement.getBoundingClientRect();
      if (element.width > 0 && element.height > 0) {
        lastVisible = {
          x: element.left - bounds.left + Math.min(element.width - 8, element.width * 0.75),
          y: element.top - bounds.top + Math.min(element.height - 6, element.height * 0.65),
        };
      }
      target.x = lastVisible.x;
      target.y = lastVisible.y;
    }
  }

  const clock = createPlaybackClock((elapsed) => {
    if (!cursor || reduced || disposed || paused) return;
    if (!root.isConnected || document.hidden) {
      clock.setPlaying(false);
      root.dataset.demoPlayback = 'paused';
      return;
    }
    // Four 1.8-second phases followed by the original 0.8-second reading pause.
    const time = (elapsed / 1000) % 8;
    const phase = Math.min(3, Math.floor(time / 1.8));
    const local = time - phase * 1.8;
    const action = local >= 0.65 ? phase : phase - 1;
    if (phase !== previousPhase || action !== previousAction) {
      previousPhase = phase;
      previousAction = action;
      root.dataset.demoPhase = String(phase);
      root.dataset.demoAction = String(action);
      if (scene === 'results') root.dataset.demoFilter = action >= 2 ? 'country' : '';
      if (scene === 'api') {
        root.dataset.demoCopied = String(action >= 1);
        root.dataset.apiView = action >= 2 ? 'usage' : 'key';
      }
      // Filter/copy labels can reflow in a translation without resizing the outer frame.
      measure();
    }

    let previous = { x: 0, y: 0 };
    let position = previous;
    for (const target of pointerTargets) {
      const start = target.index * 1.8;
      if (target.index <= phase) {
        const move = easeInOutCubic(playbackProgress(time, start, 0.5));
        position = {
          x: previous.x + (target.x - previous.x) * move,
          y: previous.y + (target.y - previous.y) * move,
        };
        previous = target;
      }
    }
    const press = easeInOutCubic(playbackProgress(local, 0.5, 0.1));
    const release = easeInOutCubic(playbackProgress(local, 0.6, 0.16));
    cursor.style.transform = `translate(${position.x}px, ${position.y}px) scale(${1 - 0.16 * (press - release)})`;
    cursor.style.opacity = String(
      easeInOutCubic(playbackProgress(time, 0, 0.5)) * (1 - playbackProgress(time, 7.7, 0.3)),
    );
    cursor.style.visibility = time > 0 ? 'visible' : 'hidden';
    if (scene === 'query' && query) {
      const text = queryText.slice(
        0,
        Math.ceil(queryText.length * playbackProgress(time, 0.65, 0.8)),
      );
      if (query.textContent !== text) query.textContent = text;
    }
  });

  function synchronize() {
    if (disposed) return;
    if (!cursor || reduced) {
      clock.reset();
      restore();
      root.dataset.demoPlayback = 'static';
      return;
    }
    const playing = !paused && visible && !document.hidden && root.isConnected;
    clock.setPlaying(playing);
    root.dataset.demoPlayback = playing ? 'playing' : 'paused';
    if (paused) {
      cursor.style.visibility = 'hidden';
      if (query) query.textContent = queryText;
    }
  }

  function motionChanged(event: MediaQueryListEvent) {
    reduced = event.matches;
    synchronize();
  }

  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
      synchronize();
    },
    { threshold: [0, 0.05] },
  );
  intersection.observe(root);
  const resize = new ResizeObserver(() => {
    if (resizeFrame || disposed) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (disposed) return;
      measure();
      if (!reduced) clock.refresh();
    });
  });
  resize.observe(root);
  for (const { element, cursorElement } of pointerTargets) {
    resize.observe(element);
    if (cursorElement !== element) resize.observe(cursorElement);
  }
  document.addEventListener('visibilitychange', synchronize);
  preference.addEventListener('change', motionChanged);
  measure();
  synchronize();
  return {
    setPaused(next: boolean) {
      paused = next;
      synchronize();
    },
    dispose() {
      disposed = true;
      intersection.disconnect();
      resize.disconnect();
      cancelAnimationFrame(resizeFrame);
      document.removeEventListener('visibilitychange', synchronize);
      preference.removeEventListener('change', motionChanged);
      clock.dispose();
      restore();
      root.dataset.demoPlayback = 'static';
    },
  };
}
