import { Text } from '../ui/Text';
import { observeViewportActivity } from '../../lib/visibility';
import { EditorialHeading } from '../layout/PageSections';
import { useEffect, useRef, useState } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { MorphPanel } from '../ui/MorphPanel';
import { LocaleText } from '../../i18n/LocaleText';
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
      const tilt = 0.94;
      const scale = Math.min(width / 510, height / 410);
      const project = (x: number, y: number, z: number) => {
        const rx = x * Math.cos(turn) + z * Math.sin(turn);
        const rz = z * Math.cos(turn) - x * Math.sin(turn);
        const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
        const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
        const perspective = 820 / (820 + depth);
        return {
          x: width / 2 + rx * scale * perspective,
          y: height / 2 + ry * scale * perspective,
          depth,
          perspective,
        };
      };
      const rgb = inverse ? '219,251,253' : '3,122,143';
      const points: (ReturnType<typeof project> & { radius: number; alpha: number })[] = [];
      for (let row = 0; row < 17; row++) {
        for (let col = 0; col < 27; col++) {
          const x = (col - 13) * 18;
          const z = (row - 8) * 21;
          const wave = Math.sin(x * 0.016 - phase) * 58 + Math.cos(z * 0.02 + phase) * 18;
          const point = project(x, wave, z);
          const crest = (wave + 76) / 152;
          const edge = Math.min(1, (Math.min(col, 26 - col, row, 16 - row) + 1) / 3);
          points.push({
            ...point,
            radius: (1.45 + crest * 0.8) * scale * point.perspective,
            alpha: (0.24 + crest * 0.62) * edge,
          });
        }
      }
      points.sort((a, b) => b.depth - a.depth);
      for (const point of points) {
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb},${point.alpha})`;
        context.fill();
      }
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
          <div className="team-workflow__visual">
            <div className="team-sequence" aria-label={t('Illustrative analyst handoff')}>
              {['Investigation brief', 'Service observations', 'Research notes', 'API handoff'].map(
                (label, i) => (
                  <div className={selected === i ? 'is-current' : ''} key={label}>
                    <span>0{i + 1}</span>
                    <div>
                      <strong>
                        <LocaleText>{t(label)}</LocaleText>
                      </strong>
                      <small>
                        {t(
                          [
                            'Domain or technical attribute',
                            'Host · protocol · technology',
                            'Evidence and open questions',
                            'Scripts and internal reports',
                          ][i]!,
                        )}
                      </small>
                    </div>
                    <i aria-hidden="true" />
                  </div>
                ),
              )}
            </div>
            <MorphPanel>
              <div className="team-workflow__record">
                <span>
                  <LocaleText>{t(item.meta)}</LocaleText>
                </span>
                <code>{t(item.record)}</code>
              </div>
            </MorphPanel>
          </div>
          <div>
            <div className="team-workflow__tabs" role="group" aria-label={t('Team workflow')}>
              {teamStages.map((s, i) => (
                <button
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  key={s.name}
                >
                  <span>0{i + 1}</span>
                  <LocaleText>{t(s.name)}</LocaleText>
                </button>
              ))}
            </div>
            <MorphPanel>
              <div className="team-workflow__detail" data-morph-enter>
                <Text as="h3">{item.title}</Text>
                <Text as="p">{item.text}</Text>
              </div>
            </MorphPanel>
          </div>
        </div>
      </div>
    </section>
  );
}
