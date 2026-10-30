# Public API documentation source

The website's public reference at `/developers/api/docs` consumes the **API-key client HTTP API** contract. It is not the authenticated product's cookie-session HTTP/WebSocket contract. The existing overview and marketing pricing data are separate consumers; do not derive client HTTP request limits from their pricing-table API rates.

## One editable bundled snapshot

`public/api/client.openapi.json` is the canonical, downloadable OpenAPI 3.1.1 snapshot. Vite validates it and embeds a derived read-only view of the rendered documentation data into the lazy documentation route; the full canonical JSON remains available for download. There is no second hand-maintained schema in TypeScript, and loading the reference does not fetch a live API endpoint.

To replace the bundled contract:

1. Obtain the owner-approved client contract and replace only `public/api/client.openapi.json`.
2. Keep its source provenance and an explicit `info.version`. The current date/draft version labels the documentation artifact, not a verified backend release.
3. Run `npm run check` and `npm run build`. Invalid bundled data fails before the site is served or built.
4. Run the API acceptance tests in the supported browsers and review EN/RU/Traditional Chinese, narrow/wide widths and both themes.

The build keeps the compiled reference in the lazy documentation graph. The optional transport and runtime adapter load only when a public replacement URL is configured. Do not import them into the homepage, global navigation or commercial page graphs. Existing bundle budgets still apply.

## Optional replaceable public URL

`VITE_APCO_API_SPEC_URL` optionally points to a public OpenAPI JSON document. It has **no remote default** and is distinct from the retired `VITE_APCO_API_DOCS_URL` setting. Setting or changing the URL requires a build; replacing the document at that configured URL does not require changing the UI code.

Use an HTTPS URL with anonymous CORS access. HTTP is accepted only for `localhost`, `127.0.0.1` and `[::1]` development. Credentials and fragments are rejected. All Vite settings are public: never put a password, API key, signed/private download URL or other secret here.

The bundled reference renders immediately. The optional request:

- retrieves only documentation JSON with GET, credentials omitted and no referrer;
- sends no API key and refuses redirects;
- has one five-second deadline covering transport-module loading, document retrieval and validation, with at most 512 KiB of decoded response bytes;
- cancels when the reader leaves the page;
- never follows remote schema references or interprets source HTML;
- replaces the page only after the complete supported document validates.

Unreachable, oversized, malformed or incompatible documents leave the bundled reference in place with a localized notice. The page shows the loaded artifact version and source document. A replacement document cannot change the API server origin used by copied key-bearing examples; an intentional origin migration requires review and replacement of the bundled snapshot.

There is no try-it-out client, credential entry, API response cache, analytics call or paid search execution on this page. cURL examples are generated as safely quoted text from validated operations and documented JSON examples, not copied from executable extension text.

## Supported documentation profile

This is a bounded adapter for this product's public reference, **not** a general OpenAPI validator or arbitrary Swagger renderer. It currently requires:

- OpenAPI `3.1.1`, source provenance, credential-free HTTP(S) server data and eight stable operation ids;
- actual root and operation security that require an `apiKey` in the `X-API-Key` header, consistent with the authentication metadata;
- standard JSON request/response schemas and examples, using bounded local `$ref` resolution;
- the documented `x-apcosys-*` operation ids, method names, plan allow-lists, credit weights, filter catalog, error catalog and policy metadata.

Recursive `anyOf`, `allOf` property overrides and OpenAPI 3.1 type arrays are supported. Conditional refinements are not flattened into universal requirements. Unsupported breaking schema/authentication/operation changes fall back to the bundle instead of silently omitting methods. Update the adapter and its tests deliberately for a new documentation profile.

All 12 existing section anchors remain stable. Canonical aliases such as `#get-host`, `#host-analytics`, `#private-hosts`, `#get-private-host` and `#private-analytics` also work. Locale, hosting-base, query and hash handling stay with the existing site router.

Authored interface labels are translated in both locale catalogs. Source-derived technical prose is explicitly labelled as coming from the English contract and bypasses typographic rewriting so JSON quotes and literal values remain exact; it is not presented as an invented translated contract. Unresolved source conflicts remain visible, including named-header empty-value behavior.

## Focused tests

Pure adapter/configuration/loader tests are included in the architecture gate:

```sh
npx tsx --test scripts/tests/public-api-document.test.ts scripts/tests/public-api-loader.test.ts
```

Default bundled-reference browser coverage (after the normal build):

```sh
npx playwright test tests/acceptance/api-documentation.spec.ts --project=chromium --workers=1
```

Optional-source browser coverage uses intercepted fixtures only. Build and run with the same public setting; the following URL is a local test fixture, not an actual published endpoint:

```sh
VITE_APCO_API_SPEC_URL=http://127.0.0.1:4187/apcoseb-clear/api/fixture.openapi.json npm run build
VITE_APCO_API_SPEC_URL=http://127.0.0.1:4187/apcoseb-clear/api/fixture.openapi.json npx playwright test tests/acceptance/api-document-source.spec.ts --project=chromium --workers=1
```

Configured-source cases are intentionally skipped when that setting is absent; a separate default case verifies that the optional transport is not loaded. The configured cases cover valid replacement, unavailable/invalid documents, authentication and origin constraints, projection limits, transport-chunk failure, the shared deadline and navigation cancellation before or after transport loading. Restore a normal build with the optional setting unset after fixture verification; do not publish the test configuration.
