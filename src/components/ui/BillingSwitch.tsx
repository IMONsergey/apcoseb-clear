import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { useId } from 'react';
import type { BillingPeriod } from '../../lib/pricing';
export function BillingSwitch({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}) {
  const { t } = useLocale();
  const name = useId();
  return (
    <fieldset className="billing-switch">
      <legend className="sr-only">{t('Billing period')}</legend>
      <div className="segmented" data-period={value}>
        {(['annually', 'monthly'] as const).map((period) => (
          <label key={period}>
            <input
              type="radio"
              name={name}
              value={period}
              checked={value === period}
              onChange={() => onChange(period)}
            />
            <span>
              <LocaleText>{t(period === 'annually' ? 'Annually' : 'Monthly')}</LocaleText>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
