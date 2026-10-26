import { Text } from '../ui/Text';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { httpApiMethodCosts, plans } from '../../content/plans';
import { formatApiRate } from '../../lib/pricing';
export function CreditsExplained() {
  const { t } = useLocale();
  return (
    <section
      id="usage-guide"
      className="stage-usage-guide section-space"
      aria-labelledby="usage-guide-title"
    >
      <div className="container">
        <div className="editorial-heading">
          <Text as="h2" id="usage-guide-title">
            Understand your allowance.
          </Text>
          <Text as="p">
            Compare the tools and credit allowance first. HTTP API method costs and request-rate
            limits describe different parts of usage.
          </Text>
        </div>
        <div className="usage-layout">
          <div className="request-costs">
            <Text as="h3">HTTP API method costs</Text>
            <div>
              <strong>{httpApiMethodCosts.hosts}</strong>
              <Text as="p">
                Host or bucket request
                <span>Host search, host details, bucket search or bucket analytics.</span>
              </Text>
            </div>
            <div>
              <strong>{httpApiMethodCosts.analytics}</strong>
              <Text as="p">
                Host analytics
                <span>Aggregated results for the same host-search filters.</span>
              </Text>
            </div>
            <Text as="p" className="editorial-note">
              These are method-cost units against the public HTTP API rate allowance. They do not
              specify a debit in plan credits or Search Tokens.
            </Text>
          </div>
          <div className="stage-usage-guide__questions">
            <article>
              <div>
                <Text as="h3">What can I do with Plus?</Text>
                <p>
                  <LocaleText>
                    {t(
                      'Example: search {domain}, then request analytics for the same filters. Two HTTP calls have a combined method cost of {cost} ({search} + {analytics}), returning host records and a breakdown to guide your next filter.',
                      {
                        domain: 'example.com',
                        cost: httpApiMethodCosts.hosts + httpApiMethodCosts.analytics,
                        search: httpApiMethodCosts.hosts,
                        analytics: httpApiMethodCosts.analytics,
                      },
                    )}
                  </LocaleText>
                </p>
              </div>
            </article>
            <article>
              <div>
                <Text as="h3">Credits, tokens and API costs</Text>
                <Text as="p">
                  Each plan includes a credit allowance. Search Token packages add capacity. HTTP
                  API method costs apply to the API rate allowance. Contact our team to confirm
                  credit usage for your workflow.
                </Text>
              </div>
            </article>
            <article>
              <div>
                <Text as="h3">Upgrade or buy more?</Text>
                <Text as="p">
                  Upgrade when you need another capability or team access. Consider a package when
                  you need more requests at the same access level.
                </Text>
              </div>
            </article>
            <article>
              <div>
                <Text as="h3">How do API rate limits work?</Text>
                <p>
                  <LocaleText>
                    {t(
                      'Plus: {plus}. Expert: {expert}. Business: {business}. Requests above your plan’s rate receive HTTP 429. These limits control frequency, not the credit balance.',
                      {
                        plus: formatApiRate(
                          plans.find((plan) => plan.id === 'plus')!,
                          t,
                        ),
                        expert: formatApiRate(
                          plans.find((plan) => plan.id === 'expert')!,
                          t,
                        ),
                        business: formatApiRate(
                          plans.find((plan) => plan.id === 'business')!,
                          t,
                        ),
                      },
                    )}
                  </LocaleText>
                </p>
              </div>
            </article>
            <a className="stage-text-link" href="#search-token-packages">
              <LocaleText>{t('See Search Token packages')}</LocaleText>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
