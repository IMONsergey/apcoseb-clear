# Content and integration ownership

The site presents Apcosys in English. Metrics, plan values and synthetic interface demonstrations are not a live product feed. Keep demo labels and reserved example addresses when editing scenes.

| Content                                               | Authoritative project location                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| Metrics, plan copy, navigation and walkthrough labels | `src/content/metrics.ts`, `plans.ts`, `navigation.ts`, `research.ts` |
| Billing calculations                                  | `src/lib/pricing.ts`                                                 |
| Synthetic investigation records and API template      | `src/content/product-demo.ts`                                        |
| Page titles and metadata                              | `src/content/routes.ts`, `src/content/legal-routes.ts`               |
| Internal explanatory content                          | Individual page in `src/pages/<group>/`                              |
| Legal bodies                                          | `docs/legal-sources/`, compiled by `npm run legal:compile`           |
| Product destinations and support contact              | `.env.example`, `src/config/public-settings.ts`                      |

Owner approval is required for current prices/annual rules, credits/tokens and limits, metrics, CVE claims, monitoring availability, actual API contracts, final sign-in/checkout destinations, legal amendments and organization marks. See [Handoff](HANDOFF.md) for the exact implementation boundary of each feature.

Contact opens an email draft; this repository does not deliver or store messages. Registration does not transfer the chosen pricing plan. Sign In opens the client product homepage during migration; an optional verified same-origin sign-in URL can override it. API examples are illustrative; they do not establish a production schema. Legal sources retain their original addresses and legal wording even when the general site support email is overridden.

Light, Dark and System are available. RU/CN controls are unavailable until translations are approved. Preview `noindex` and `robots.txt` remain deliberate and should only change for an approved public launch.

## Pricing and ordinary text

`content/plans.ts` is the single record for numeric prices, credits, users, features and API limits. Cards, the comparison table, API table and Business summary derive from it. `lib/pricing.ts` owns formatting, annual calculation and comparison row labels. Separate Search Token packages are not subscription allowances. Update the record rather than copying a value into a page.

Write normal text in `<Text as="p">`, headings and shared editorial components; Typograf runs automatically and caches results. Existing `LocaleText` labels also pass through Typograf. The rendered HTML tag and CSS selectors stay unchanged. Native inline children are formatted recursively, but custom components own their own text. Code, input values and legal HTML stay verbatim. For a literal example use `<code>` or `data-typography="verbatim"`. Do not add manual non-breaking spaces to ordinary editorial copy.
