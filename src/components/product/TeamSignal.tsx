import { Text } from '../ui/Text';
import { observeViewportActivity } from '../../lib/visibility';
import { EditorialHeading } from '../layout/PageSections';
import { useEffect, useRef, useState } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { MorphPanel } from '../ui/MorphPanel';
import { useLocale } from '../../i18n/context';

/** One flowing field of observations: depth comes from the wave, without a wire grid. */
export function TeamSignal({ inverse = false }: { inverse?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { paused, reduced } = useMotion();
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const state = { phase: 1.2 };
    const tilt = 0.94;
    const sinTilt = Math.sin(tilt);
    const cosTilt = Math.cos(tilt);
    const points = Array.from({ length: 17 * 27 }, (_, index) => {
      const row = Math.floor(index / 27);
      const col = index % 27;
      return {
        gridX: (col - 13) * 18,
        gridZ: (row - 8) * 21,
        edge: Math.min(1, (Math.min(col, 26 - col, row, 16 - row) + 1) / 3),
        x: 0,
        y: 0,
        depth: 0,
        radius: 0,
        alpha: 0,
      };
    });
    let width = 600,
      height = 440,
      visible = false,
      previous = 0;
    const render = () => {
      const now = performance.now();
      if (now - previous < 32 && !reduced) return;
      previous = now;
      context.clearRect(0, 0, width, height);
      const phase = state.phase;
      const turn = -0.24 + Math.sin(phase) * 0.035;
      const sinTurn = Math.sin(turn);
      const cosTurn = Math.cos(turn);
      const scale = Math.min(width / 510, height / 410);
      for (const point of points) {
        const { gridX: x, gridZ: z } = point;
        const wave = Math.sin(x * 0.016 - phase) * 58 + Math.cos(z * 0.02 + phase) * 18;
        const rx = x * cosTurn + z * sinTurn;
        const rz = z * cosTurn - x * sinTurn;
        const ry = wave * cosTilt - rz * sinTilt;
        point.depth = wave * sinTilt + rz * cosTilt;
        const perspective = 820 / (820 + point.depth);
        const crest = (wave + 76) / 152;
        point.x = width / 2 + rx * scale * perspective;
        point.y = height / 2 + ry * scale * perspective;
        point.radius = (1.45 + crest * 0.8) * scale * perspective;
        point.alpha = (0.24 + crest * 0.62) * point.edge;
      }
      points.sort((a, b) => b.depth - a.depth);
      context.fillStyle = inverse ? 'rgb(219,251,253)' : 'rgb(3,122,143)';
      for (const point of points) {
        context.globalAlpha = point.alpha;
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };
    let frame = 0;
    let lastTick = 0;
    const tick = (now: number) => {
      state.phase =
        1.2 +
        ((state.phase - 1.2 + (Math.min(now - lastTick, 64) * Math.PI * 2) / 18000) %
          (Math.PI * 2));
      lastTick = now;
      render();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (visible && !paused && !reduced && !document.hidden) {
        lastTick = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      previous = 0;
      render();
    });
    const stopActivity = observeViewportActivity(canvas, (active) => {
      visible = active;
      sync();
    });
    resize.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      stopActivity();
    };
  }, [inverse, paused, reduced]);
  return <canvas ref={ref} className="team-signal-field" aria-hidden="true" />;
}

const teamStages = [
  {
    name: 'Frame the question',
    title: 'One lead. A shared starting point.',
    text: 'Turn an alert, domain or technical question into an investigation your team can follow.',
    record: 'portal.example.com',
    meta: 'Analyst input',
  },
  {
    name: 'Review the evidence',
    title: 'Put observations in context.',
    text: 'Compare the service response, detected software and observation time before escalating a lead.',
    record: '443 / HTTPS / nginx',
    meta: 'Technical review',
  },
  {
    name: 'Validate the signal',
    title: 'Separate a lead from a finding.',
    text: 'Record what has been observed and what still needs independent verification.',
    record: 'Version applicability → verify',
    meta: 'Research decision',
  },
  {
    name: 'Continue in your tools',
    title: 'Move the next task forward.',
    text: 'Use supported API access to bring observations into scripts, reports and existing workflows.',
    record: 'Search → review → integrate',
    meta: 'Workflow handoff',
  },
];
const teamRecords = [
  [
    ['Domain', 'example.com'],
    ['Host', '198.51.100.24'],
    ['Services', '443 / HTTPS · 80 / HTTP'],
  ],
  [
    ['Host', '198.51.100.24'],
    ['Technology', 'nginx 1.24.0'],
    ['Evidence source', 'HTTP Server header'],
  ],
  [
    ['Observed signal', 'HTTP Server header'],
    ['Version applicability', 'Check vendor advisory'],
    ['Patch state', 'Needs validation'],
  ],
  [
    ['Host', '198.51.100.24'],
    ['Technology', 'nginx 1.24.0'],
    ['Workflow handoff', 'Scripts and internal reports'],
  ],
] as const;

export function TeamWorkflow() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const item = teamStages[selected]!;
  return (
    <section id="team-workflow" className="team-workflow section-space">
      <div className="container">
        <EditorialHeading
          title="From analyst question to technical context."
          intro="Follow one lead through a shared research process. Choose a step to see which evidence and open questions move with it."
        />
        <div className="team-workflow__layout">
          <div
            className="team-workflow__tabs team-sequence"
            role="group"
            aria-label={t('Team workflow')}
          >
            {teamStages.map((stage, index) => (
              <button
                type="button"
                aria-pressed={selected === index}
                aria-controls="team-workflow-record"
                className={selected === index ? 'is-current' : ''}
                onClick={() => setSelected(index)}
                key={stage.name}
              >
                <span>0{index + 1}</span>
                <span>
                  <strong>
                    {t(
                      [
                        'Investigation brief',
                        'Service observations',
                        'Research notes',
                        'API handoff',
                      ][index]!,
                    )}
                  </strong>
                  <small>{t(stage.name)}</small>
                </span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12m-5-5 5 5-5 5" />
                </svg>
              </button>
            ))}
          </div>
          <MorphPanel>
            <div className="team-workflow__visual" id="team-workflow-record" aria-live="polite">
              <div className="team-workflow__detail" data-morph-enter>
                <div className="team-workflow__label">
                  <span>{t(item.meta)}</span>
                  <span aria-hidden="true">0{selected + 1} / 04</span>
                </div>
                <Text as="h3">{item.title}</Text>
                <Text as="p">{item.text}</Text>
              </div>
              <div className="team-workflow__record">
                <code>{t(item.record)}</code>
                <dl>
                  {teamRecords[selected]!.map(([label, value]) => (
                    <div key={label}>
                      <dt>{t(label)}</dt>
                      <dd>{t(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </MorphPanel>
        </div>
      </div>
    </section>
  );
}
