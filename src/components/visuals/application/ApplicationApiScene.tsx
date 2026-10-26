import { useLocale } from '../../../i18n/context';
import { businessPlan } from '../../../content/plans';
import { formatApiRate } from '../../../lib/pricing';
import { ApplicationGlyph as Glyph } from './ApplicationGlyph';
import './application-api-scene.css';

const creditBalances = [
  { label: 'Query credits remaining', remaining: 1_240_500, total: businessPlan.credits },
  { label: 'Scan credits remaining', remaining: 327_680, total: 327_680 },
] as const;

function AccessSummary() {
  const { locale, t } = useLocale();
  const number = new Intl.NumberFormat(locale);
  return (
    <div className="application-api__summary">
      <h4>{t('Example balances')}</h4>
      <dl>
        <div>
          <dt>{t('Plan')}</dt>
          <dd>{t('Business')}</dd>
        </div>
        <div>
          <dt>{t(creditBalances[0].label)}</dt>
          <dd>{number.format(creditBalances[0].remaining)}</dd>
        </div>
        <div>
          <dt>{t('API rate limit')}</dt>
          <dd>{formatApiRate(businessPlan, t)}</dd>
        </div>
      </dl>
      <span className="application-api__summary-link">
        {t('Usage & limits')}
        <Glyph name="arrow" />
      </span>
    </div>
  );
}

function CreditBalances() {
  const { locale, t } = useLocale();
  const number = new Intl.NumberFormat(locale);
  return (
    <div className="application-api__credits">
      <h4 className="application-api__access">{t('Example balances')}</h4>
      {creditBalances.map(({ label, remaining, total }) => (
        <div className="application-api__credit" key={label}>
          <p className="application-api__credit-label">{t(label)}</p>
          <p className="application-api__credit-value">
            <span>{number.format(remaining)}</span>
          </p>
          <div
            className="application-api__credit-track"
            role="meter"
            aria-label={t(label)}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={remaining}
          >
            <div
              className="application-api__credit-fill"
              style={{ width: `${(remaining / total) * 100}%` }}
            />
          </div>
          <p className="application-api__credit-total">/ {number.format(total)}</p>
        </div>
      ))}
    </div>
  );
}

/** An inert excerpt of the current account-key and usage screens. */
export function ApplicationApiScene() {
  const { t } = useLocale();
  return (
    <div className="application-api-scene">
      <div className="application-api__intro">
        <h3 className="application-api__heading">{t('API access')}</h3>
        <span className="application-status">
          <Glyph name="check" />
          {t('API enabled')}
        </span>
      </div>
      <div className="application-object-tabs application-api__tabs">
        <span className="application-api__key-tab" data-demo-target="api-key-tab">
          <Glyph name="key" />
          {t('API key')}
        </span>
        <span className="application-api__usage-tab" data-demo-target="api-usage">
          <Glyph name="chart" />
          {t('Usage & limits')}
        </span>
      </div>
      <div className="application-api__workspace">
        <div className="application-api__panel application-api__panel--key" data-api-panel="key">
          <div className="application-api__credentials">
            <div className="application-api__card-heading">
              <span className="application-api__symbol">
                <Glyph name="key" />
              </span>
              <div>
                <h4>{t('Account API key')}</h4>
                <p>{t('One key for your integrations.')}</p>
              </div>
            </div>
            <div className="application-api__field-group">
              <p className="application-api__label">{t('API key')}</p>
              <div
                className="application-api__field application-api__key"
                data-demo-target="api-key"
              >
                <code>••••••••••••••••</code>
              </div>
            </div>
            <div className="application-api__actions">
              <span className="application-api__action">
                <Glyph name="eye" />
                {t('Reveal key')}
              </span>
              <span className="application-api__action" data-demo-target="api-copy">
                <Glyph name="copy" />
                <span className="application-api__copy-label">
                  <span className="application-api__copy-default">{t('Copy')}</span>
                  <span data-demo-copy-state>{t('Copied')}</span>
                </span>
              </span>
            </div>
          </div>
          <AccessSummary />
        </div>
        <div
          className="application-api__panel application-api__panel--usage"
          data-api-panel="usage"
        >
          <CreditBalances />
          <div className="application-api__limits" data-demo-target="api-limits">
            <h4>{t('Account limits')}</h4>
            <dl>
              <div>
                <dt>{t('Plan')}</dt>
                <dd>{t('Business')}</dd>
              </div>
              <div>
                <dt>{t('API rate limit')}</dt>
                <dd>{formatApiRate(businessPlan, t)}</dd>
              </div>
              <div>
                <dt>{t('API access')}</dt>
                <dd className="application-link">{t('Enabled')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
