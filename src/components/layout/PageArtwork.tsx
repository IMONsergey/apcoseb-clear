import { observeViewportActivity } from '../../lib/visibility';
import type { ThemedAsset } from '../../content/assets';
import { useEffect, useRef } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { ThemedArtwork } from '../ui/ThemedArtwork';
import { useLocale } from '../../i18n/context';

export type ArtworkKey =
  | 'search'
  | 'methodology'
  | 'monitoring'
  | 'bounty'
  | 'vulnerability'
  | 'osint'
  | 'teams'
  | 'api'
  | 'pricing'
  | 'about'
  | 'investors'
  | 'scanning'
  | 'contact';
const artwork: Record<ArtworkKey, { file: ThemedAsset; alt: string }> = {
  search: {
    file: 'inner/search.webp',
    alt: 'An optical lens brings one infrastructure host into focus.',
  },
  methodology: {
    file: 'inner/methodology.webp',
    alt: 'Transparent layers separate an observation from its interpretation.',
  },
  monitoring: {
    file: 'inner/monitoring.webp',
    alt: 'Two observations reveal a changed element over time.',
  },
  bounty: {
    file: 'use-cases/bug-bounty.webp',
    alt: 'Infrastructure organised inside a defined research scope.',
  },
  vulnerability: {
    file: 'use-cases/vulnerability-research.webp',
    alt: 'Layers of technology opened for closer examination.',
  },
  osint: {
    file: 'use-cases/osint.webp',
    alt: 'Technical indicators connected into an investigation trail.',
  },
  teams: {
    file: 'inner/teams.webp',
    alt: 'Several research inputs meet in one shared body of evidence.',
  },
  api: {
    file: 'inner/api.webp',
    alt: 'A precise connection carries data between two software systems.',
  },
  pricing: {
    file: 'inner/pricing.webp',
    alt: 'Four levels of access grow with the needs of an investigation.',
  },
  about: {
    file: 'inner/about.webp',
    alt: 'An open structure makes the internet’s technical layers visible.',
  },
  investors: {
    file: 'inner/investors.webp',
    alt: 'An open optical structure brings teal infrastructure signals into a shared centre.',
  },
  scanning: {
    file: 'inner/scanning.webp',
    alt: 'A defined boundary surrounds infrastructure being observed.',
  },
  contact: {
    file: 'inner/contact.webp',
    alt: 'Two complementary forms meet in a clear, open conversation.',
  },
};

/** A quiet periodic trace. It carries no data and never tracks the pointer. */
function SignalTrace() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reduced, paused } = useMotion();
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let raf = 0,
      visible = false,
      phase = 0,
      previous = 0,
      lastDraw = 0,
      width = 0,
      height = 0;
    let ink = getComputedStyle(el).getPropertyValue('--accent-text');
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ink;
      for (let i = 0; i < 48; i++) {
        const x = width * (0.12 + (i / 47) * 0.76);
        const y = height * 0.52 + Math.sin((i / 47) * Math.PI * 2 + phase) * height * 0.11;
        ctx.globalAlpha = 0.12 + 0.45 * Math.pow(Math.sin((i / 47) * Math.PI), 2);
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      phase += Math.min(now - previous, 64) / 8000;
      previous = now;
      if (now - lastDraw >= 1000 / 30) {
        lastDraw = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      draw();
      if (visible && !document.hidden && !reduced && !paused) {
        previous = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stopActivity = observeViewportActivity(el, (active) => {
      visible = active;
      sync();
    });
    const resize = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    resize.observe(el);
    const palette = new MutationObserver(() => {
      ink = getComputedStyle(el).getPropertyValue('--accent-text');
      draw();
    });
    palette.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    sync();
    return () => {
      cancelAnimationFrame(raf);
      stopActivity();
      resize.disconnect();
      palette.disconnect();
    };
  }, [reduced, paused]);
  return <canvas ref={canvas} className="page-artwork__trace" aria-hidden="true" />;
}

export function PageArtwork({ kind }: { kind: ArtworkKey }) {
  const { t } = useLocale();
  const asset = artwork[kind];
  return (
    <figure className={'page-artwork page-artwork--' + kind}>
      <ThemedArtwork
        asset={asset.file}
        alt={t(asset.alt)}
        width="960"
        height="640"
        decoding="async"
        fetchPriority="high"
      />
      {(kind === 'monitoring' || kind === 'api') && <SignalTrace />}
    </figure>
  );
}
