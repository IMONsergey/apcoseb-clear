import { useEffect, useRef, type ReactNode } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { LocaleText } from '../../i18n/LocaleText';

/** Native summary keyboard behavior, with cancellable measured-height animation. */
export function AnimatedDetails({
  title,
  initialOpen = false,
  children,
}: {
  title: string;
  initialOpen?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const running = useRef<Animation | null>(null);
  const expanded = useRef(initialOpen);
  const { reduced } = useMotion();
  useEffect(() => {
    const settleOnResize = () => running.current?.finish();
    window.addEventListener('resize', settleOnResize);
    return () => {
      window.removeEventListener('resize', settleOnResize);
      running.current?.cancel();
    };
  }, []);
  useEffect(() => {
    if (reduced) running.current?.finish();
  }, [reduced]);
  function toggle() {
    const el = ref.current;
    if (!el) return;
    const from = el.getBoundingClientRect().height;
    running.current?.cancel();
    running.current = null;
    expanded.current = !expanded.current;
    const next = expanded.current;
    el.dataset.expanded = String(next);
    const panel = el.querySelector<HTMLElement>('.faq-answer');
    if (panel) {
      panel.inert = !next;
      panel.setAttribute('aria-hidden', String(!next));
    }
    const settle = () => {
      el.open = next;
      el.style.height = '';
      el.style.overflow = '';
      running.current = null;
    };
    if (reduced || !el.animate) {
      settle();
      return;
    }
    el.open = true;
    el.style.height = 'auto';
    const to = next
      ? el.getBoundingClientRect().height
      : el.querySelector('summary')!.getBoundingClientRect().height;
    el.style.overflow = 'hidden';
    const animation = el.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 280,
      easing: 'cubic-bezier(.22,.61,.36,1)',
    });
    running.current = animation;
    animation.onfinish = () => {
      if (running.current === animation) settle();
    };
  }
  return (
    <details ref={ref} open={initialOpen} data-expanded={initialOpen}>
      <summary
        onClick={(event) => {
          event.preventDefault();
          toggle();
        }}
      >
        <span>
          <LocaleText>{title}</LocaleText>
        </span>
        <span className="faq-icon" aria-hidden="true">
          <span className="faq-icon__glyph" />
        </span>
      </summary>
      <div className="faq-answer">{children}</div>
    </details>
  );
}
