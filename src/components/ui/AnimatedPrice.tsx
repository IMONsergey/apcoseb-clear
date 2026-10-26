import { useEffect, useLayoutEffect, useRef } from 'react';
import { useMotion } from '../../hooks/useMotion';
import { useLocale } from '../../i18n/context';
import { getPricingFormatters } from '../../lib/pricing';

/** Digit reels run on the compositor; the actual accessible price updates immediately. */
export function AnimatedPrice({ amount }: { amount: number }) {
  const { locale } = useLocale();
  const { currency } = getPricingFormatters(locale);
  const label = currency.format(amount);
  const { reduced } = useMotion();
  const root = useRef<HTMLSpanElement>(null);
  const previous = useRef(amount);
  const animations = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const from = currency.format(previous.current);
    const direction = amount > previous.current ? 1 : -1;
    const changed = amount !== previous.current;
    previous.current = amount;
    if (
      reduced ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !changed ||
      !root.current
    ) {
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      return;
    }
    const old = [...from].reverse();
    const slots = root.current.querySelectorAll<HTMLElement>('.price-digit__reel');
    const nextAnimations: Animation[] = [];
    slots.forEach((reel, index) => {
      const place = Number(reel.dataset.place);
      const digit = Number(reel.dataset.digit);
      const oldDigit = /\d/.test(old[place] ?? '') ? Number(old[place]) : 0;
      const active = reel.getAnimations();
      const height = reel.firstElementChild?.getBoundingClientRect().height ?? 0;
      if (!height || (!active.length && oldDigit === digit)) return;
      const current = active.length
        ? -new DOMMatrixReadOnly(getComputedStyle(reel).transform).m42 / height
        : 10 + oldDigit;
      const start = (((current % 10) + 10) % 10) + 10;
      const distance =
        direction > 0 ? (digit - (start % 10) + 10) % 10 : -(((start % 10) - digit + 10) % 10);
      active.forEach((animation) => animation.cancel());
      nextAnimations.push(
        reel.animate(
          [
            { transform: `translateY(${-start * height}px)` },
            { transform: `translateY(${-(start + distance) * height}px)` },
          ],
          {
            duration: 620,
            delay: (slots.length - index - 1) * 28,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            fill: 'backwards',
          },
        ),
      );
    });
    animations.current.forEach((animation) => {
      if (!nextAnimations.includes(animation)) animation.cancel();
    });
    animations.current = nextAnimations;
  }, [amount, currency, reduced]);
  useEffect(() => () => animations.current.forEach((animation) => animation.cancel()), []);
  return (
    <span className="price-amount" ref={root}>
      <span className="sr-only">{label}</span>
      <span className="price-odometer" aria-hidden="true">
        {[...label].map((character, index) =>
          /\d/.test(character) ? (
            <span className="price-digit" key={label.length - index}>
              <span
                className="price-digit__reel"
                data-digit={character}
                data-place={label.length - index - 1}
                style={{ transform: `translateY(-${((10 + Number(character)) * 100) / 30}%)` }}
              >
                {Array.from({ length: 30 }, (_, row) => (
                  <span key={row} data-numeral={row % 10} />
                ))}
              </span>
            </span>
          ) : (
            <span className="price-symbol" key={label.length - index} data-numeral={character} />
          ),
        )}
      </span>
    </span>
  );
}
