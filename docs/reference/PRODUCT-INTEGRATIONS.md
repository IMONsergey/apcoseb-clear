# Published product integration references

The statistics snapshot below was captured on 23 October 2026; public pricing was verified again on 24 October 2026 and HTTP API documentation on 25 October 2026. They describe the separate public Apcosys product; this repository remains the marketing website. No authenticated requests, credentials, real payments or message delivery are used by its demonstrations.

## Statistics

Source: [public statistics](https://api.apcosys.net/api/statistics), a JSON response with `success` and `data`. The endpoint is publicly readable without a key.

The snapshot used in `src/content/metrics.ts` has `last_updated_timestamp=1792768164`, or `2026-10-23T15:09:24.000Z`:

| Field       | Snapshot value |
| ----------- | -------------: |
| `ipv4`      |    117,699,441 |
| `ipv6`      |    161,719,645 |
| `domains`   |    839,953,442 |
| `products`  |  1,348,017,100 |
| `cves`      |        794,597 |
| `protocols` |             54 |

Both Home and Methodology show the snapshot date and source link. The UI uses neutral Products/CVEs labels and identifies each source field. The endpoint does not document counting or deduplication semantics; a number must not be reinterpreted as distinct vulnerable hosts or a confirmed security finding. The later verification response had a newer timestamp and different values, confirming that these are changing counters. This website intentionally renders its dated snapshot and does not claim live updates.

## Pricing

Source chain: the [public pricing page](https://apcosys.net/pricing) loads the unauthenticated [pricing JSON](https://api.apcosys.net/pricing). The verified response has `timestamp=1792859126`, or `2026-10-24T16:25:26Z`.

| Plan     | Monthly price | Annual total | Listed credits | Users | HTTP API rate |
| -------- | ------------: | -----------: | -------------: | ----: | ------------- |
| Free     |            $0 |           $0 |            500 |     1 | No access     |
| Plus     |           $50 |         $480 |         25,000 |     1 | 1 request/s   |
| Expert   |          $300 |       $2,880 |        250,000 |     1 | 2 requests/s  |
| Business |          $900 |       $8,640 |      1,500,000 |     5 | 5 requests/s  |

The website's annual option is selected initially. It shows the annual total and its monthly equivalent; the billing switch does not multiply the listed credit allowance. All four source records specify `duration: "30d"`, but do not define annual credit renewal, expiry or rollover. The two existing package examples match the source: 25,000 tokens for $50 and 1,000,000 for $900. The source does not explain which account balance receives these tokens or their conversion to plan credits.

Plus includes HTTP API access, CVE context and bucket search. Expert adds full filters and leak-data context; Business provides five user seats and adds private scanning. These are capability differences, not a change to permitted commercial usage. The Free/Plus descriptive prose in the pricing JSON disagrees with its structured `search_pages` fields; the HTTP API table agrees with the structured values (2 and 25). Do not derive new page-limit claims from that conflicting prose.

## HTTP API

Source chain: the [published API documentation](https://apcosys.net/docs/api) loads a public application bundle and the [API Markdown module](https://cdn.apcosys.cc/assets/js/md-file-fIHrv7Eh.js). The page and module were verified again on 25 October 2026. The current page still references the same module; its URL records that edition rather than a permanent API endpoint. The 190,973-byte module has SHA-256 `e7133dff62fe1b791919317eca786a2c9a7844673615816a7a934e10d5b42d31`; the extracted 39,923-byte API Markdown has SHA-256 `4f96b88049f364f9096afcfa12a7e80e8ca046f3c7970a4729bedffb012ab836`. This verification read only the public reference; no authenticated API requests were made.

- Base: `https://api.apcosys.net/api/v1`.
- Authentication: `X-API-Key` with the account API key.
- Host search: `POST /search/hosts`, JSON body with optional `page`, `docs_per_page` (maximum 100) and `full_text_search` (among other documented filters).
- Search response: `total`, `page`, `docs_per_page`, `hosts`; host records include `ip`, organization/country context, `uts` (last update in Unix seconds) and `open_ports`.
- Other methods: `GET /search/hosts/:ip`, `POST /search/analytics`, `POST /search/buckets`, `POST /search/buckets/analytics`, `POST /search/private/hosts`, `GET /search/private/hosts/:ip`, and `POST /search/private/analytics`. Private methods require Business.
- Host detail uses `ports[]`, with certificate properties directly in `tls_info`; it has no nested `certificate_info`. Bucket `result_count` counts items in that response. Host sorting ignores the supplied sort fields and always uses descending `uts`; bucket sorting supports `cts`, `uts` and `size_mb`.
- Published API rates: Plus 1 request/s, Expert 2, Business 5; Free has no API access.
- Errors use a JSON `error` string. Documented statuses include 400 for an invalid request or host identifier, 500 for a search/server error (including unsupported fields), 401 for a missing/invalid key, 402 for plan-restricted fields/values, 404 for a missing host and 429 for exceeding the rate limit.

The documented method costs consume the HTTP API **rate allowance**:

| Method             | Method-cost units |
| ------------------ | ----------------: |
| `hosts`            |                 1 |
| `analytics`        |                 3 |
| `buckets`          |                 1 |
| `bucket_analytics` |                 1 |
| Other endpoints    |                 1 |

The website's two-call example (host search, then analytics) therefore has a combined method cost of 4 (1 + 3). This does not establish a debit of four plan credits or Search Tokens. The source gives no conversion between those balances and API method costs, and does not specify the rate allowance's accounting window or refill algorithm. Requests per second, method-cost units and purchased/allocated balances must remain distinct.

`src/content/api-example.ts` uses the documented request structure and a deliberately small 20-record page. The copyable cURL example reads the key from an environment variable; the browser never stores a key or runs the request. Response values use a reserved documentation IP and an explicitly synthetic organization. The API illustration is an inert account excerpt with a masked key, example balances and simulated copy/usage states. It does not create credentials, change balances or call the API.

Website Documentation links resolve to localized `/developers/api/docs`, a separate lazy page covering all eight methods, authentication, rates, filters, response fields, errors and integration guidance. The shorter API overview keeps `/developers/api#documentation` working as a first-request section with a link to the full reference. `src/content/api-documentation.ts` holds the paraphrased reference data and synthetic examples; it is not a runtime dependency of the overview or Home. The external URLs above are maintenance sources, not the destination of those navigation links. The authenticated web application's session-cookie/WebSocket protocol must not be confused with this public HTTP API.

## Account and billing handoff

The public product exposes `/login`. A standalone `/register` route was not present in the published route manifest, so the website does not send users to that assumed URL. Default Sign In and Free entry use the product login. A custom same-origin sign-in URL remains configurable.

Paid-plan dialogs display the selected plan and monthly/annual period, with one Open Apcosys action that opens account entry in a new tab. The marketing page does not append invented checkout or subscription parameters, and it does not claim that the selection or payment was completed in the product.

## Boundaries requiring owner information

| Area                            | Remaining external decision                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usage rights, earlier issue B29 | Map Free/Plus/Expert/Business to the legal Personal/Free and Business/Enterprise categories. No rights for Plus or Expert are inferred.                                                                          |
| Allowance and package rules     | Supply the credit/Search Token conversion and debit rules, annual allocation/renewal, expiry and rollover before calculating request capacity or promising replenishment.                                        |
| Automatic checkout              | Supply a supported checkout/plan-selection contract before automatic transfer is implemented.                                                                                                                    |
| Contact delivery                | Provide a backend only if direct server delivery is required. The current Email us action validates the form and opens a prepared mailto draft; it never claims delivery.                                        |
| Legal approval                  | English policy originals are unchanged. RU/ZH document bodies display directly, with English available through the language selector; owner/legal approval remains distinct from structural and semantic checks. |
| Domain and indexing             | Configure the final marketing origin and explicitly enable indexing there. Review copies stay noindex.                                                                                                           |

Public sources support the specific technical facts above; they do not establish contractual approval, ownership of a host, monitoring availability or all commercial billing semantics.
