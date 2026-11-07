import { Text } from '../ui/Text';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { httpApiCreditWeights } from '../../content/plans';
import { apiDocumentationPath } from '../../config/site';
import { siteHref } from '../../app/paths';

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
            <Text as="h3">Search-credit weights</Text>
            <div>
              <strong>{httpApiCreditWeights.hosts}</strong>
              <Text as="p">
                Host or bucket request
                <span>Host search, host details, bucket search or bucket analytics.</span>
              </Text>
            </div>
            <div>
              <strong>{httpApiCreditWeights.analytics}</strong>
              <Text as="p">
                Host analytics · default settings
                <span>The default 12 enabled facets have a search-credit weight of 3.</span>
              </Text>
            </div>
            <Text as="p" className="editorial-note">
              These are search-credit weights, separate from request-rate limits. Host analytics
              uses the enabled facet count divided by 4, rounded up; its weight can change with your
              analytics settings.
            </Text>
          </div>
          <div className="stage-usage-guide__questions">
            <article>
              <div>
                <Text as="h3">What can I do with Plus?</Text>
                <p>
                  <LocaleText>
                    {t(
                      'With default analytics settings, a host search for {domain} and an analytics request have a combined search-credit weight of {cost} ({search} + {analytics}). Charge reuse and account access rules determine whether credits are deducted.',
                      {
                        domain: 'example.com',
                        cost: httpApiCreditWeights.hosts + httpApiCreditWeights.analytics,
                        search: httpApiCreditWeights.hosts,
                        analytics: httpApiCreditWeights.analytics,
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
                  Each plan includes search credits. Search Token packages add search capacity. HTTP
                  API requests can spend search credits; the rate limiter separately controls how
                  quickly requests are accepted.
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
                <Text as="p">
                  Request-rate limits apply per account and depend on API configuration. An exceeded
                  limit returns HTTP 429. Review the API documentation before planning request
                  throughput.
                </Text>
                <a
                  className="stage-text-link"
                  href={siteHref(apiDocumentationPath) + '#access-limits'}
                >
                  {t('See API documentation')}
                </a>
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
