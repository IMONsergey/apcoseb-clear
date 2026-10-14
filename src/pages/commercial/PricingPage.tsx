import { Text } from '../../components/ui/Text';
import { planComparison } from '../../lib/pricing';
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

function FullPlanComparison() {
  return (
    <section className="stage-plan-comparison section-space" id="compare-plans">
      <div className="container">
        <EditorialHeading
          title="Compare plans."
          intro="Compare the allowance, research tools and API access included at each level. Choose the capabilities you need before adding more capacity."
        />
        <div
          role="region"
          aria-label="Scroll to compare plan features"
          tabIndex={0}
          className="stage-table-scroll"
        >
          <table className="stage-data-table stage-plan-table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} scope="col">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planComparison.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {plans.map((plan) => (
                    <td key={plan.id}>{row.value(plan)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Text as="p" className="stage-helper stage-table-hint">
          Swipe the table horizontally on smaller screens to compare all four plans.
        </Text>
      </div>
    </section>
  );
}

export default function PricingPage() {
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
              <strong>25,000</strong>
              <span>Search Tokens</span>
              <b>$50</b>
            </div>
            <div>
              <strong>1,000,000</strong>
              <span>Search Tokens</span>
              <b>$900</b>
            </div>
          </div>
          <Notice>
            Packages shown for the client preview. Check eligibility, token balance, expiry and
            final purchase terms in your account.
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
              text: 'Use the switch above the plans to compare billing periods. Annual prices show the discounted monthly equivalent; the annual total is shown on the plan.',
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
              title: 'What happens after cancellation?',
              text: 'The proposed billing terms keep paid features available until the end of the current subscription period. Confirm the applicable terms in your account.',
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
