# Application demonstrations

The five Home research scenes and the API illustration follow the current Apcosys SaaS interface. They are translated React/HTML excerpts with native playback that loops automatically without manual controls. Research frames use a preferred 3:2 aspect ratio with a 300px minimum height; their excerpts adapt to the available width so all visible text fits. The homepage retains all 13 sections in the approved order, including both Audience illustrations.

Playback and layout checks live in `tests/acceptance/`. See [QA](QA.md) for the test commands and the commit’s GitHub Actions run for results.

## Current design source

- Live interface: [Apcosys SaaS](https://assaasdev.vercel.app/), reviewed again on 25 October 2026, including the current query, results, host, TLS, refinement, API-key and account-usage screens.
- Fixture provenance: [IMONsergey/Assaasdev](https://github.com/IMONsergey/Assaasdev) at [`85f41b7569ccb172b4eceabd345e9c79cfde470e`](https://github.com/IMONsergey/Assaasdev/commit/85f41b7569ccb172b4eceabd345e9c79cfde470e), dated 24 October 2026, “Refine native navigation, avatars and guided workflows”.
- Example records and account values: [`src/demo/fixtures.ts` at that revision](https://github.com/IMONsergey/Assaasdev/blob/85f41b7569ccb172b4eceabd345e9c79cfde470e/src/demo/fixtures.ts).

The Figma references below document the original design. Current scene composition and example values follow the application and fixtures linked above.

## Current six excerpts

| Scene             | Implemented content and progression                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query             | Centered search heading; `nginx` query; Filters, All types and History where space permits; text/domain/IP/technology hints; adjoining search label and arrow. No illustration or application shell header.                                                                                                                                                                                           |
| Results           | Results/Analytics tabs, a four-host result count and a compact table excerpt. Playback opens Filters, selects Germany, applies the condition, then points to the matching result.                                                                                                                                                                                                                     |
| Host              | `192.0.2.10`, `node-1.example.com`, Germany and AS64496 / Example Research Network. Overview, Services and DNS retain the application's hierarchy; the selected service has Response and TLS context. Services shows the fixture total of 100 with a three-service excerpt: 443 HTTPS, 80 HTTP and 22 SSH. The HTTPS response and nginx 1.0 remain connected to that host.                            |
| Technical context | The same host and HTTPS/443 context, TLS 1.3, certificate subject and issuer, validity dates and DNS name.                                                                                                                                                                                                                                                                                            |
| Next step         | Search for `node-1.example.com`, show the applied Domain condition and retain the same host as the matching result.                                                                                                                                                                                                                                                                                   |
| API               | API key and Usage & limits tabs. Key pairs a masked-key card with a compact Example balances summary: Business, query credits and the confirmed API rate. Usage shows separate query/scan credit cards and account limits. Copy feedback and the usage switch occur after the cursor arrives. Reveal and Copy are inert illustration labels; there is no rotate control, live request or exposed key. |

The results excerpt shows two of the four matching fixture records before filtering: `192.0.2.10` in Germany and `192.0.2.144` in the Netherlands. The record count describes the result set; the compact illustration does not attempt to display every row.

The TLS example uses the source fixture's `Example Certificate Authority`, subject/DNS name `node-1.example.com`, and validity from **1 October 2026 to 1 January 2027**. Dates are formatted in the selected locale with UTC.

| API account field                   | Fixture value                                                |
| ----------------------------------- | ------------------------------------------------------------ |
| Plan                                | Business                                                     |
| Query credits remaining / allowance | 1,240,500 / 1,500,000                                        |
| Scan credits remaining / allowance  | 327,680 / 327,680                                            |
| API rate                            | 5 requests / second, from the website's Business plan record |
| API access                          | Enabled                                                      |

Credit meters derive their fill from the displayed remaining/allowance values. The sixteen dots in the key field are a visual mask, not an exposed credential or an assertion about real key length. These are the separate application's demonstration fixtures, not live scan results or a production account.

## Layout, typography and assets

The shared `ApplicationFrame` contains the scene and decorative cursor without a logo strip, navigation shell or shared screen header. Controls within the search box belong to the excerpt itself. The first query scene has no artwork.

- All five research excerpts fit inside their cards. `--step-copy-inset` coordinates the text and illustration left edges at each carousel breakpoint. Frames have a **300px minimum height** and a preferred **3:2 aspect ratio**. Each scene fills that resolved frame, including in WebKit; responsive composition keeps all visible text inside both the scene and card. Narrow Results rows place the country below the host, and TLS omits the secondary DNS row while retaining the domain in the host and certificate subject.
- The carousel retains one card through 767px, two from 768px and three from 1200px. Shared rows keep the card text and media aligned.
- Research body text has a **12px minimum**; primary identifiers and selected details use larger shared type roles where space permits. Compact breakpoints simplify secondary detail instead of scaling the whole interface down.
- API body text, labels and actions use **14px**, card headings 14px and the API heading 20px; the compact status badge uses 12px. The synthetic mask uses the supplied Latin monospace face so CJK fallback glyph widths cannot overflow its field. Above 479px of application-container width, credentials and their access summary sit in two columns; at 479px and below they stack. Usage metrics sit side by side where they fit and stack at application widths up to 319px, preserving long translated labels.
- Both API panels occupy the same grid area and reserve the taller panel's natural content height. Inactive content uses `visibility`, preserving the frame through playback and reduced-motion changes. Inner rows are aligned to their content rather than stretched. The outer section no longer has a 796px minimum or an automatically expanded gap above its CTA. On desktop the screen shares the heading's top edge; the left copy uses bounded spacing. Below 1200px the section becomes one column.
- Both light and dark scene palettes use the website's existing tokens. The cyan API section keeps its established outer composition.

`ApplicationGlyph.tsx` supplies lightweight inline SVG line icons. Country flags, the nginx mark and the certificate icon continue to use registered local exports from `public/assets/application/` through `assetUrl`. Earlier exported artwork, toolbar and API icons remain available as source assets, but their old rendered-size table is not a specification for this implementation. No remote Figma image URLs are shipped.

## Native playback and data boundaries

`ApplicationFrame`, `ApplicationProductScene` and `ApplicationApiScene` render their HTML before motion loads. `useApplicationPlayback` loads the shared playback module near the viewport and skips it for reduced motion. Failed downloads leave the static HTML readable.

The native clock retains its eight-second cycle: four 1.8-second phases followed by a 0.8-second reading pause. Each pointer move takes 0.5 seconds, followed by a short press and an action at 0.65 seconds; the remaining phase gives time to read. The cursor fades before the cycle restarts. Playback drives query typing, the country-filter panel/result state, copied state and the API key/usage switch without drawing focus rectangles. `data-demo-phase` identifies the movement phase and `data-demo-action` the last completed action (`-1` before the first action). `data-demo-playback` reports `static`, `playing` or `paused`; `data-api-view` identifies the API panel.

The controller exposes `setPaused` and `dispose` for lifecycle coordination, but no Pause/Play control is shown. Research and API scenes loop automatically. Viewport visibility pauses offscreen playback, and document visibility pauses hidden tabs. A changed reduced-motion preference resets the clock, restores the complete captured query and initial state, hides the cursor and removes the completed-action/filter/copy/API-view state. Resume never accumulates paused time. Resize measurements are scheduled through `requestAnimationFrame`; cleanup removes observers/listeners, cancels pending work and restores owned styles.

If a motion chunk fails, the complete initial React frame remains available. The illustration subtree is inert and hidden from assistive technology; its enclosing image role supplies a translated description. EN, RU and Traditional Chinese text, dates and balances follow the selected locale. The illustrated search, key and tab controls do not submit requests, reveal or rotate a key, copy real account data or change product state. Real navigation stays outside the inert scene.

The developer page is separate from these illustrations and retains the documented POST host-search example and X-API-Key authentication. See [Product integrations](reference/PRODUCT-INTEGRATIONS.md).

## Vector asset sources

The previous replacement used [Apcosys, page «01 · Приложение»](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=899-3620), previously named «Приложение — доработка». Design context, visible child nodes and screenshots were read; the source Figma file was not edited.

| Earlier scene | Historical Figma frame                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Query         | [899:4021 — Поиск, начало](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=899-4021)            |
| Results       | [899:4117 — Поиск, результаты](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=899-4117)        |
| Host          | [899:5079 — Объект, адрес и сервисы](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=899-5079)  |
| Evidence      | [903:48414 — Сертификат TLS](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=903-48414)         |
| Refined query | [903:48044 — Поиск, применён domain](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=903-48044) |
| API           | [903:53837 — API, доступ](https://www.figma.com/design/lLMSuy0RrCiPhg873xpVUY/Apcosys?node-id=903-53837)            |
