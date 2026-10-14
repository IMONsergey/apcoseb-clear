import { gsap } from 'gsap';

/** Loaded only as the product preview approaches the viewport. */
export function mountEvidencePlayback(root: HTMLDivElement, paused: boolean) {
  const cursor = root.querySelector<HTMLElement>('.evidence-cursor');
  const label = root.querySelector<HTMLElement>('[data-playback-label]');
  const progress = root.querySelector<HTMLElement>('[data-playback-progress]');
  if (!cursor) return;
  let visible = false;
  let interacting = root.matches(':hover') || root.contains(document.activeElement);
  let tl: gsap.core.Timeline;
  const context = gsap.context(() => {
    tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.4 });
    const phases = [
      ['.product-evidence__query strong', 'Read the query'],
      ['.product-evidence__result[aria-pressed="true"]', 'Select a matching host'],
      ['.product-evidence__service[aria-pressed="true"]', 'Inspect the observed service'],
      [
        '.evidence-response, .product-evidence__cve, .product-evidence__next',
        'Follow the evidence',
      ],
    ];
    phases.forEach(([selector, caption], index) => {
      const target = root.querySelector<HTMLElement>(selector!);
      if (!target) return;
      const at = index * 2.2;
      tl.call(
        () => {
          if (label) label.textContent = caption!;
        },
        [],
        at,
      );
      tl.to(
        cursor,
        {
          x: () =>
            target.getBoundingClientRect().left -
            root.getBoundingClientRect().left +
            Math.min(target.clientWidth * 0.7, 190),
          y: () =>
            target.getBoundingClientRect().top -
            root.getBoundingClientRect().top +
            Math.min(target.clientHeight * 0.55, 48),
          opacity: 1,
          duration: 0.7,
          ease: 'power2.inOut',
        },
        at + 0.1,
      );
      tl.fromTo(
        target,
        { '--evidence-focus': 0 },
        { '--evidence-focus': 1, duration: 0.5, ease: 'power2.out' },
        at + 0.65,
      );
      tl.to(cursor, { scale: 0.88, duration: 0.12, repeat: 1, yoyo: true }, at + 0.85);
      tl.to(target, { '--evidence-focus': 0, duration: 0.55 }, at + 1.6);
    });
    const query = root.querySelector('.product-evidence__query strong');
    tl.fromTo(
      query,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.15,
        ease: 'steps(20)',
        immediateRender: false,
      },
      0.3,
    );
    tl.fromTo(
      root.querySelectorAll('.evidence-response code'),
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.9,
        stagger: 0.18,
        ease: 'steps(24)',
        immediateRender: false,
      },
      6.9,
    );
    if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 8.8, ease: 'none' }, 0);
    tl.to(cursor, { opacity: 0, duration: 0.4 }, 8.5);
  }, root);
  const sync = () => {
    tl.paused(paused || !visible || document.hidden || interacting);
    gsap.set(cursor, { visibility: interacting || paused ? 'hidden' : 'visible' });
    if (interacting || paused) {
      gsap.set(root.querySelectorAll('.product-evidence__query strong, .evidence-response code'), {
        clipPath: 'none',
      });
    }
  };
  const enter = () => {
    interacting = true;
    gsap.set(root.querySelectorAll('.product-evidence__query strong, .evidence-response code'), {
      clipPath: 'none',
    });
    sync();
  };
  const leave = () => {
    interacting = root.contains(document.activeElement);
    sync();
  };
  const blur = (event: FocusEvent) => {
    interacting = root.contains(event.relatedTarget as Node);
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
  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', enter);
  root.addEventListener('focusout', blur);
  document.addEventListener('visibilitychange', sync);
  return () => {
    observer.disconnect();
    root.removeEventListener('pointerenter', enter);
    root.removeEventListener('pointerleave', leave);
    root.removeEventListener('focusin', enter);
    root.removeEventListener('focusout', blur);
    document.removeEventListener('visibilitychange', sync);
    context.revert();
  };
}
