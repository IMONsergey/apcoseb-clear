import './PricingSection.css';
import '../../styles/billing-dock.css';
import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { useRef, useState, type MouseEvent } from 'react';
import { MobileBillingDock } from './MobileBillingDock';
import { plans, type Plan } from '../../content/plans';
import { signInUrl } from '../../config/site';
import { PlanHandoff } from './PlanHandoff';
import { DoubleButton } from '../ui/DoubleButton';
import { Modal } from '../ui/Modal';
import { Visual } from '../visuals/Visual';
import { BillingSwitch } from '../ui/BillingSwitch';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import {
  calculatePrice,
  getPricingFormatters,
  ANNUAL_DISCOUNT_PERCENT,
  type BillingPeriod,
} from '../../lib/pricing';
export function PricingSection({
  showTeamBanner = true,
  title,
  comparisonHref,
}: {
  showTeamBanner?: boolean;
  title?: string;
  comparisonHref?: string;
}) {
  const { locale, t } = useLocale();
  const { currency, count } = getPricingFormatters(locale);
  const formatPrice = (amount: number) => currency.format(amount);
  const formatCount = (value: number) => count.format(value);
  const [compare, setCompare] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>('annually');
  const [selected, setSelected] = useState<Plan | null>(null);
  return (
    <section className="pricing section-space" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div className="pricing-options" ref={rangeRef} data-testid="pricing-options">
          <div className="pricing-heading">
            <h2 id="pricing-title">
              {title ? (
                t(title)
              ) : locale === 'en' ? (
                <>
                  <LocaleText>{t('Start free.')}</LocaleText>
                  <br />
                  <span>
                    <LocaleText>{t('Upgrade when your')}</LocaleText>
                    <br className="desktop-break" />{' '}
                    <LocaleText>{t('investigation needs more.')}</LocaleText>
                  </span>
                </>
              ) : (
                <LocaleText>
                  {t('Start free. Upgrade when your investigation needs more.')}
                </LocaleText>
              )}
            </h2>
            <div className="billing billing--desktop">
              <p>
                {locale === 'en' ? (
                  <>
                    <LocaleText>{t('Subscribe annually')}</LocaleText>
                    <br />
                    <LocaleText>
                      {t('and save {discount}%!', { discount: ANNUAL_DISCOUNT_PERCENT })}
                    </LocaleText>
                  </>
                ) : (
                  <LocaleText>
                    {t('Subscribe annually and save {discount}%!', {
                      discount: formatCount(ANNUAL_DISCOUNT_PERCENT),
                    })}
                  </LocaleText>
                )}
              </p>
              <BillingSwitch value={period} onChange={setPeriod} />
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {period === 'annually'
              ? t(
                  'Annual billing selected. Displayed monthly prices include {discount} percent savings. Annual totals are shown below.',
                  { discount: ANNUAL_DISCOUNT_PERCENT },
                )
              : t('Monthly billing selected.')}
          </p>
          <MobileBillingDock rangeRef={rangeRef} period={period} onChange={setPeriod} />
          <div className="plan-grid" id="pricing-plans">
            {plans.map((plan) => (
              <article
                id={`plan-${plan.id}`}
                key={plan.id}
                className={`plan-card${plan.id === 'plus' ? ' plan-card--featured' : ''}`}
              >
                <div>
                  <h3>
                    <LocaleText>{t(plan.name)}</LocaleText>
                  </h3>
                  <p className="plan-description">
                    <LocaleText>{t(plan.description)}</LocaleText>
                  </p>
                </div>
                <div className="plan-price-block">
                  <p className="plan-price">
                    <AnimatedPrice amount={calculatePrice(plan.price, period).monthly} />
                    {plan.price > 0 && (
                      <span className="price-unit">
                        <LocaleText>{t('/mo')}</LocaleText>
                      </span>
                    )}
                  </p>
                  <p className="plan-billing-note">
                    <LocaleText>
                      {plan.price > 0
                        ? period === 'annually'
                          ? t('{amount} billed annually', {
                              amount: formatPrice(calculatePrice(plan.price, period).total),
                            })
                          : t('Billed monthly')
                        : '\u00a0'}
                    </LocaleText>
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>
                      <LocaleText>{t('Credits')}</LocaleText>
                    </dt>
                    <dd>{formatCount(plan.credits)}</dd>
                  </div>
                  <div>
                    <dt>
                      <LocaleText>{t('Users')}</LocaleText>
                    </dt>
                    <dd>{formatCount(plan.users)}</dd>
                  </div>
                </dl>
                <div className="plan-actions">
                  {plan.id === 'free' ? (
                    <a className="plan-button" href={signInUrl}>
                      <LocaleText>{t(plan.action)}</LocaleText>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="plan-button"
                      onClick={(event) => {
                        event.currentTarget.focus();
                        setSelected(plan);
                        setPlanOpen(true);
                      }}
                    >
                      <LocaleText>{t(plan.action)}</LocaleText>
                    </button>
                  )}
                  {plan.id === 'business' && (
                    <a
                      className="plan-button plan-button--accent stage-plan-contact"
                      href={siteHref('/contact')}
                    >
                      <LocaleText>{t('Talk to Us')}</LocaleText>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="comparison-action">
            <DoubleButton
              variant="inverse"
              {...(comparisonHref
                ? { href: comparisonHref }
                : {
                    onClick: (event: MouseEvent<HTMLElement>) => {
                      event.currentTarget.focus();
                      setCompare(true);
                    },
                  })}
            >
              <LocaleText>
                {t(comparisonHref ? 'View a detailed comparison' : 'Compare plans')}
              </LocaleText>
            </DoubleButton>
          </div>
        </div>
        {showTeamBanner && (
          <div className="contact-banner">
            <Visual kind="dots" direction="left-to-right" />
            <div>
              <h3>
                <LocaleText>{t('Have specific requirements?')}</LocaleText>
              </h3>
              <p>
                <LocaleText>{t('Tell us about your data, API or procurement needs.')}</LocaleText>
              </p>
            </div>
            <DoubleButton variant="inverse" href={siteHref('/contact')}>
              <LocaleText>{t('Talk to Us')}</LocaleText>
            </DoubleButton>
          </div>
        )}
      </div>

      <Modal
        open={compare}
        onClose={() => setCompare(false)}
        title={t('Compare plans')}
        className="comparison-modal"
      >
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t('Plan comparison')}>
          <table>
            <caption>
              <LocaleText>{t('Plan allowances and access')}</LocaleText>
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <LocaleText>{t('Plan')}</LocaleText>
                </th>
                {plans.map((p) => (
                  <th scope="col" key={p.id}>
                    <LocaleText>{t(p.name)}</LocaleText>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <LocaleText>{t('Monthly price')}</LocaleText>
                </th>
                {plans.map((p) => (
                  <td key={p.id}>{formatPrice(calculatePrice(p.price, period).monthly)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">
                  <LocaleText>
                    {t(period === 'annually' ? 'Billed annually' : 'Billed monthly')}
                  </LocaleText>
                </th>
                {plans.map((p) => (
                  <td key={p.id}>{formatPrice(calculatePrice(p.price, period).total)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">
                  <LocaleText>{t('Credits')}</LocaleText>
                </th>
                {plans.map((p) => (
                  <td key={p.id}>{formatCount(p.credits)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">
                  <LocaleText>{t('Users')}</LocaleText>
                </th>
                {plans.map((p) => (
                  <td key={p.id}>{formatCount(p.users)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">
                  <LocaleText>{t('API access')}</LocaleText>
                </th>
                {plans.map((p) => (
                  <td key={p.id}>
                    <LocaleText>{p.api ? t('Included') : '—'}</LocaleText>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <DoubleButton
          variant="secondary"
          href={siteHref('/pricing') + '#compare-plans'}
          className="comparison-full-link"
        >
          <LocaleText>{t('View all plan features')}</LocaleText>
        </DoubleButton>
        <p className="modal-note">
          <LocaleText>
            {t(
              'Final pricing, billing periods and purchase conditions are confirmed in Apcosys before payment.',
            )}
          </LocaleText>
        </p>
        <DoubleButton href={signInUrl}>
          <LocaleText>{t('Continue in Apcosys')}</LocaleText>
        </DoubleButton>
      </Modal>
      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={selected ? t('{name} plan', { name: t(selected.name) }) : t('Plan')}
      >
        {selected && (
          <>
            <p>
              <LocaleText>{t(selected.description)}</LocaleText>
            </p>
            <p className="selected-plan-price">
              {formatPrice(calculatePrice(selected.price, period).monthly)}
              <LocaleText>{t(' / month')}</LocaleText>
            </p>
            <p className="modal-note">
              <LocaleText>
                {period === 'annually'
                  ? t('{amount} billed annually · {discount}% savings', {
                      discount: ANNUAL_DISCOUNT_PERCENT,
                      amount: formatPrice(calculatePrice(selected.price, period).total),
                    })
                  : t('Billed monthly')}
              </LocaleText>
            </p>
            <dl className="plan-summary">
              <div>
                <dt>
                  <LocaleText>{t('Credits')}</LocaleText>
                </dt>
                <dd>{formatCount(selected.credits)}</dd>
              </div>
              <div>
                <dt>
                  <LocaleText>{t('Users')}</LocaleText>
                </dt>
                <dd>{formatCount(selected.users)}</dd>
              </div>
              <div>
                <dt>
                  <LocaleText>{t('API access')}</LocaleText>
                </dt>
                <dd>
                  <LocaleText>{selected.api ? t('Included') : '—'}</LocaleText>
                </dd>
              </div>
            </dl>
            <PlanHandoff />
          </>
        )}
      </Modal>
    </section>
  );
}
