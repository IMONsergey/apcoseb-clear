import { Text } from '../ui/Text';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
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
            Choose a plan for its capabilities. Add capacity when the tools already fit and you need
            to make more requests.
          </Text>
        </div>
        <div className="usage-layout">
          <div className="request-costs">
            <Text as="h3">Request costs</Text>
            <div>
              <strong>1</strong>
              <Text as="p">
                Search Token
                <span>Request without analytics, such as host information or bucket search.</span>
              </Text>
            </div>
            <div>
              <strong>4</strong>
              <Text as="p">
                Search Tokens<span>Search with category analytics.</span>
              </Text>
            </div>
            <Text as="p" className="editorial-note">
              Usage applies to website and API requests. Check the current charge in your account.
            </Text>
          </div>
          <div className="stage-usage-guide__questions">
            <article>
              <div>
                <Text as="h3">Who is each plan for?</Text>
                <Text as="p">
                  Free introduces search. Plus adds API access for individual research. Expert adds
                  deeper filtering. Business brings access for a team and a larger allowance.
                </Text>
              </div>
            </article>
            <article>
              <div>
                <Text as="h3">Credits or Search Tokens?</Text>
                <Text as="p">
                  Plan allowances are listed in credits; additional packages are sold as Search
                  Tokens. The credit-to-token relationship is not yet verified. Confirm the account
                  balance and package terms before adding capacity.
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
                <Text as="h3">What happens at the limit?</Text>
                <Text as="p">
                  Check the remaining balance before a larger investigation. Ask the team about
                  exhaustion, expiry and rollover if these affect your workflow.
                </Text>
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
