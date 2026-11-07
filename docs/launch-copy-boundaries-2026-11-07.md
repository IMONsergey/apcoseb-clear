# Launch copy boundaries — 7 November 2026

This change is prepared in an isolated marketing checkout that incorporates the reviewed canonical API implementation `d98e069b13c8bd3af9ba867f8a720e0cf3d19d9a`, a direct descendant of `fd3fedb9d9ca557008994c84ba2b888525090f17`. It changes source and local acceptance checks; it is not a publication receipt or a production activation.

## Implemented scope

- **F06:** Plan records no longer interpret the pricing field as 1/2/5 HTTP requests per second. Pricing and API entry pages link to the API reference. Team copy and the application illustration make no numeric throughput promise. HTTP method weights are described as search-credit charging, separate from the rate limiter.
- **X08:** Saving cookie preferences closes the modal, restores focus, then displays a persistent, dismissible status on the page. Storage failure has its own message and does not claim persistence. Reopening clears the previous result. Optional trackers remain disabled.
- **X05:** Mobile legal pages use natural title, description and action heights. Document navigation, the existing collapsed table of contents and print behavior remain available.
- **F11:** The marketing-specific storage notice is separate from the published legal body. Cookie preferences on this site do not control the separate application.
- **V04:** A visible English-interface notice accompanies website entry, search handoff and plan handoff. Product URLs, search parameters, prices, plan availability and legal originals are unchanged.

## API source and limits of the evidence

Primary document: <https://api.apcosys.net/api/v1/client.openapi.json>, inspected 7 November 2026. The retrieved document is OpenAPI 3.1.1, version `2026-11-07-draft`, SHA-256 `bda1884109fd761dde202dbe130e903196f5c0ff3822781afc738ea75d6786b9`.

The document is a transcription of the supplied client-API source documentation, not a live measurement of the deployed limiter. Relevant JSON pointers:

- `/x-apcosys-rate-limit`: one bucket per account, separate from website WebSocket limits; configurable defaults of 100 rate tokens per second and burst 10. The pricing field `api_rate_limit` is explicitly not read by this limiter.
- `/x-apcosys-credit-policy`: charge reuse for the same account, method and raw body for 600 seconds; analytics weight is ceil(enabled facets / 4), normally 3 for 12 facets. Charge reuse and documented access exceptions mean a displayed weight is not a promise of a debit on every call.
- The method-level `x-apcosys-credit-weight` entries describe search-credit weights. They do not define method weights for the request-rate bucket.

No API requests that spend credits are part of these marketing checks.

## Decisions still required

| Decision                                         | Owner                                                | Acceptance evidence                                                                                                                                                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01: canonical product destination and migration | Product owner + release owner                        | A named destination tied to an accepted release; login/return and draft handoff verified there. No destination is selected by this patch.                                                                                             |
| D05: commercial API entitlement and key issuance | Backend owner + product owner                        | Written mapping of plan availability, key issuance, permitted methods, deployed limiter configuration and customer copy. This patch does not change plan access booleans.                                                             |
| D06: actual service processors and cookie policy | Service operator + legal reviewer                    | Inventory of enabled services, domains, purposes, retention and control mechanisms; the policy explicitly separates marketing and application scope. Published originals, dates and processor claims are not silently rewritten here. |
| V04: native language acceptance                  | RU and Traditional Chinese reviewers + product owner | Review terms, numbers, CTA meaning and legal translations. Translation coverage and screenshots are not substitutes for legal or native-language approval.                                                                            |

## F12 documentation proposal for the release owner

The operational runbook must separate source delivery, build artifact, runtime configuration and public activation. Record the accepted source commit, exact archive and manifest checksums, target host/service/current path, and the corresponding rollback receipt. Keep older PR25/Vercel/GitHub Actions instructions explicitly historical. The marketing Pages pipeline and the SaaS server-only pipeline are different release paths.

Existing 7 November read-only receipts identify the SaaS static root as `/home/sergey/Projects/apcosys/current` on the canonical origin, with the then-current target `releases/pr25-ui-7b04af1-20261102`. The old manifest source commit is a declaration with an index binding; it is not a full reproduced-build proof. These are historical observations, not a fresh server check by this patch.

## R04 static-asset continuity proposal

Retaining the previous release directory alone does not preserve old chunks: the observed Nginx asset route serves only through `current`.

Before a future activation, the release owner should prepare and verify an immutable asset union, or an equivalent versioned-asset scheme, in both directions:

1. Preserve the old release unchanged as the immediate baseline. Prepare the new release and a rollback companion separately.
2. Include every old and new hashed asset required by retained browser tabs in both serving targets. Stop on any same-path/different-SHA collision; do not overwrite active files or hard-link mutable files into the old release.
3. Check the intended entry HTML, release manifest, public runtime configuration and all asset checksums before activation.
4. Rehearse old-tab and new-tab lazy imports across the proposed switch and rollback in an isolated acceptance environment. Ordinary missing assets must remain 404.
5. Only the separately authorized activation stage may atomically switch `current`. Its post-check must bind the intended entry/manifest/runtime and exercise retained-tab assets. Any mismatched manifest/runtime, missing required chunk or failed critical flow triggers the documented rollback path.

This is a proposal, not an executable activation script. No union package is represented as prepared or tested here, and rollback has not been tested by this patch.

## Local verification to record before delivery

Use the compatible lockfile dependencies, format only changed files, run `npm run check` and `npm run build`, then the relevant legal, localization, pricing/content and interaction acceptance suites. The cookie regressions cover EN, RU and Traditional Chinese with successful and blocked storage, repeated saves, visible page feedback and keyboard focus. Visual acceptance must inspect mobile legal pages and the language notice in the built artifact. Record command results and artifact identity separately; do not infer public delivery from a green local build.
