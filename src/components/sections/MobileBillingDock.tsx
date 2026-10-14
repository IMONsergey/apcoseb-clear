import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { useRef, type RefObject } from 'react';
import { useBillingDock } from '../../hooks/useBillingDock';
import { ANNUAL_DISCOUNT_PERCENT, type BillingPeriod } from '../../lib/pricing';
import { BillingSwitch } from '../ui/BillingSwitch';

type Props = {
  rangeRef: RefObject<HTMLDivElement | null>;
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
};

/** Fixed visually, but kept before the cards in reading and keyboard order. */
export function MobileBillingDock({ rangeRef, period, onChange }: Props) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const visible = useBillingDock(rangeRef, ref);
  return (
    <aside
      ref={ref}
      className="billing-dock"
      data-visible={visible}
      aria-label={t('Plan billing options')}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="billing-dock__offer">
        <strong>
          <LocaleText>{t('Save {discount}%', { discount: ANNUAL_DISCOUNT_PERCENT })}</LocaleText>
        </strong>
        <span key={period}>
          <LocaleText>
            {t(period === 'annually' ? 'Annual billing selected' : 'with annual billing')}
          </LocaleText>
        </span>
      </div>
      <BillingSwitch value={period} onChange={onChange} />
    </aside>
  );
}
