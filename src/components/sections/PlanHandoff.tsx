import { signInUrl } from '../../config/site';
import { useLocale } from '../../i18n/context';
import { DoubleButton } from '../ui/DoubleButton';
import './PlanHandoff.css';

/** The chosen plan remains visible while the separate account opens. */
export function PlanHandoff() {
  const { t } = useLocale();
  return (
    <div className="plan-handoff">
      <p id="plan-handoff-note" className="plan-handoff__note">
        {t('Choose your plan and billing period after signing in.')}
      </p>
      <DoubleButton
        href={signInUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="plan-handoff-note plan-handoff-tab-hint"
      >
        {t('Open Apcosys')}
      </DoubleButton>
      <span className="sr-only" id="plan-handoff-tab-hint">
        {t('Opens in a new tab')}
      </span>
    </div>
  );
}
