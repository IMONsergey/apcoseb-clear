# Content and integration ownership

All published pages are available in English, Russian and Traditional Chinese, including reference legal translations. Coverage values are a dated public statistics snapshot; plan values and synthetic interface demonstrations are not a live product feed. Keep demo labels and reserved example addresses when editing scenes.

| Content                                               | Authoritative project location                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| Metrics, plan copy, navigation and walkthrough labels | `src/content/metrics.ts`, `plans.ts`, `navigation.ts`, `research.ts` |
| Billing calculations                                  | `src/lib/pricing.ts`                                                 |
| Synthetic investigation records                       | `src/content/product-demo.ts`                                        |
| Documented HTTP request and synthetic response        | `src/content/api-example.ts`                                         |
| Page titles and metadata                              | `src/content/routes.ts`, `src/content/legal-routes.ts`               |
| Internal explanatory content                          | Individual page in `src/pages/<group>/`                              |
| Legal bodies                                          | `docs/legal-sources/`, compiled by `npm run legal:compile`           |
| Product destinations and support contact              | `.env.example`, `src/config/public-settings.ts`                      |

Owner approval is required for current prices/annual rules, credits/tokens and limits, CVE claims, monitoring availability, changes to published API contracts, checkout integration, legal amendments and organization marks. Dated coverage values and the HTTP contract are independently sourced; avoid inferring counting or billing semantics not stated by those sources. See [Handoff](HANDOFF.md) for the exact implementation boundary of each feature.

Contact validates the form and opens an email draft; it does not deliver messages to a server. Drafts are retained in the current browser tab for up to 24 hours, with an in-memory fallback when session storage is unavailable. The plan dialog retains the selected plan and period and opens the product login in a new tab. It does not invent automatic checkout parameters. Sign In defaults to `/login`; an optional verified same-origin URL can override it. The API request follows the published HTTP documentation; its response values are synthetic and no request runs in the website. [Product integrations](reference/PRODUCT-INTEGRATIONS.md) records the source contract. Legal sources retain their original addresses and legal wording even when the general site support email is overridden.

Light, Dark and System are available. RU/Traditional Chinese controls and route output are included in ordinary builds. Each destination deployment still requires review. Preview `noindex` and `robots.txt` remain deliberate and should only change for an approved public launch.

## Pricing and ordinary text

`content/plans.ts` is the single record for numeric prices, credits, users, features and API limits. Cards, the comparison table, API table and Business summary derive from it. `lib/pricing.ts` owns formatting, annual calculation and comparison row labels. Separate Search Token packages are not subscription allowances. The API/Data License still uses Personal/Free and Business/Enterprise categories, while current pricing uses Free/Plus/Expert/Business. The repository contains no approved mapping for Plus or Expert; Pricing directs users to confirm permitted commercial use before purchasing. Only the content owner can approve a revised mapping or license wording. Update the record rather than copying a value into a page.

Write normal text in `<Text as="p">`, headings and shared editorial components; Typograf runs automatically and caches results. Existing `LocaleText` labels also pass through Typograf. The rendered HTML tag and CSS selectors stay unchanged. Native inline children are formatted recursively, but custom components own their own text. Code, input values and legal HTML stay verbatim. For a literal example use `<code>` or `data-typography="verbatim"`. Do not add manual non-breaking spaces to ordinary editorial copy.
