import { Text } from '../../components/ui/Text';
import { formatApiRate, formatCredits, formatPrice, planComparison } from '../../lib/pricing';
import { siteHref } from '../../app/paths';
import { primarySearch, linkTo } from '../../components/layout/pageLinks';
import { PricingSection } from '../../components/sections/PricingSection';
import { CreditsExplained } from '../../components/product/CreditsExplained';
import { plans } from '../../content/plans';
import { PageFrame, Notice } from '../../components/layout/PageFrame';
import {
  EditorialSection,
  EditorialHeading,
  ReadingRows,
} from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';

function FullPlanComparison() {
  const { locale, t } = useLocale();
  return (
    <section className="stage-plan-comparison section-space" id="compare-plans">
      <div className="container">
        <EditorialHeading
          title="Compare plans."
          intro="Plus adds API access, CVE context and bucket search. Expert adds full filters and leak-data context; Business adds team access and private scanning."
        />
        <Text as="p" className="stage-helper stage-table-hint" id="plan-comparison-hint">
          Swipe the table horizontally on smaller screens to compare all four plans.
        </Text>
        <div
          role="region"
          aria-label={t('Scroll to compare plan features')}
          aria-describedby="plan-comparison-hint"
          tabIndex={0}
          className="stage-table-scroll"
        >
          <table className="stage-data-table stage-plan-table">
            <thead>
              <tr>
                <th scope="col">{t('Feature')}</th>
                {plans.map((plan) => (
                  <th key={plan.id} scope="col">
                    {t(plan.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planComparison.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{t(row.label)}</th>
                  {plans.map((plan) => {
                    const value =
                      row.label === 'API rate limit'
                        ? formatApiRate(plan, t)
                        : row.label === 'Credits'
                          ? formatCredits(plan.credits, false, locale)
                          : row.value(plan);
                    const translated =
                      row.label === 'Private Scanner' && plan.privateScanner
                        ? t('Listed for {plan}', {
                            plan: t(plan.name[0] + plan.name.slice(1).toLowerCase()),
                          })
                        : /[A-Za-z]/.test(value)
                          ? t(value)
                          : value;
                    return <td key={plan.id}>{translated}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Text as="p" className="stage-helper">
          Search reads the public index. Private scans are available by request for hosts you own,
          with consent and verified ownership; results are shared only with you.
        </Text>
        <p className="stage-helper">
          {t(
            'Need to use data commercially? Confirm the permitted use for your selected plan with Apcosys before purchasing.',
          )}{' '}
          <a className="stage-text-link" href={siteHref('/contact') + '?topic=Other'}>
            {t('Confirm data usage')}
          </a>
        </p>
      </div>
    </section>
  );
}

export default function PricingPage() {
  const { locale, t } = useLocale();
  return (
    <PageFrame
      artwork="pricing"
      heroLinks={[
        { label: 'Explore plans', href: '#pricing' },
        linkTo('Talk to Us', '/contact', true),
      ]}
      variant="commercial"
      title="Choose the access your research needs."
      description="Start free. Upgrade when you need more searches, deeper filters, API access or a team."
      sections={[
        { label: 'Plans', id: 'pricing' },
        { label: 'Usage', id: 'usage-guide' },
        { label: 'Compare', id: 'compare-plans' },
        { label: 'More capacity', id: 'search-token-packages' },
        { label: 'Billing', id: 'billing-questions' },
      ]}
      closing={{
        title: 'Start with your next research question.',
        description:
          'Explore the public search first. Talk to the team when you need shared access, invoice payment or help evaluating a plan.',
      }}
      links={[primarySearch, linkTo('Talk to Us', '/contact', true)]}
    >
      <PricingSection
        showTeamBanner={false}
        title="Find your level of access."
        comparisonHref="#compare-plans"
      />
      <CreditsExplained />
      <FullPlanComparison />
      <section className="stage-credits section-space" id="search-token-packages">
        <div className="container">
          <EditorialHeading
            title="Search Token packages."
            intro="Need more search capacity without changing your level of access? A package adds capacity; a plan upgrade changes capabilities."
          />
          <div className="stage-token-grid">
            <div>
              <strong>{formatCredits(25_000, false, locale)}</strong>
              <span>{t('Search Tokens', { count: 25_000 })}</span>
              <b>{formatPrice(50, locale)}</b>
            </div>
            <div>
              <strong>{formatCredits(1_000_000, false, locale)}</strong>
              <span>{t('Search Tokens', { count: 1_000_000 })}</span>
              <b>{formatPrice(900, locale)}</b>
            </div>
          </div>
          <Notice>
            Packages are additional purchases. Confirm which balance receives the tokens and when
            they expire before payment.
          </Notice>
        </div>
      </section>
      <EditorialSection
        id="billing-questions"
        title="Billing questions."
        intro="A few practical details before you choose. Review the final terms in the product checkout before payment."
      >
        <ReadingRows
          items={[
            {
              title: 'Can I start for free?',
              text: 'The Free plan is intended for personal, non-commercial use, with one Free account per person.',
            },
            {
              title: 'Monthly or annual billing?',
              text: 'Annual pricing shows a monthly equivalent and the total billed for a year. The billing switch changes prices, not the credit amounts listed with each plan.',
            },
            {
              title: 'How can I pay?',
              text: 'Monthly subscriptions use card checkout. Ask the team about invoice payment for an annual Business subscription.',
            },
            {
              title: 'What about taxes?',
              text: 'Applicable VAT or GST and the final payable amount are shown in checkout before you complete the purchase.',
            },
            {
              title: 'When do credits renew?',
              text: 'Contact our team to confirm annual credit renewal, expiry and unused-credit terms before purchase.',
            },
            {
              title: 'How are refunds handled?',
              text: 'Refund eligibility follows the payment provider’s policy and applicable consumer law. Review the current policy in checkout or contact the team with your billing question.',
            },
          ]}
        />
      </EditorialSection>
    </PageFrame>
  );
}
