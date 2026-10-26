# Deployment and rollback

## Build for the destination

| Destination                        | Build                            | Local preview                      |
| ---------------------------------- | -------------------------------- | ---------------------------------- |
| GitHub Pages `/apcoseb-clear/`     | `npm run build`                  | `npm run preview`                  |
| Root domain `/` (including Vercel) | `npm run build:root`             | `npm run preview -- --base=/`      |
| Other subdirectory `/site/`        | `npm run build -- --base=/site/` | `npm run preview -- --base=/site/` |

All three use `scripts/build.ts`: legal-source parity, TypeScript, Vite with the requested base, route metadata, then bundle budgets. Deploy the contents of `dist/` at exactly that path. A second build replaces `dist/`; never rebuild while browser tests are using it.

The build generates metadata for every route in `src/content/routes.ts` in EN, RU and Traditional Chinese, plus the 404 fallback. HTML includes a no-JavaScript fallback; React renders the full page content in the browser. A custom static server should serve actual files and route directories before the SPA fallback to retain route-specific static metadata.

## Public origin and indexing

| Setting                   | Meaning                                                                 | Default                                                                                 |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `APCO_SITE_BASE`          | GitHub workflow build path, such as `/` or `/apcoseb-clear/`            | `/<repository-name>/`; `/` for a user or organization Pages repository                  |
| `APCO_PUBLIC_SITE_ORIGIN` | Marketing site's HTTPS origin, without a subdirectory or credentials    | GitHub workflows use `https://<lowercase-owner>.github.io`; local builds leave it unset |
| `APCO_SITE_INDEXABLE`     | `true` publishes `index, follow`; `false` publishes `noindex, nofollow` | `false`                                                                                 |

`APCO_PUBLIC_SITE_ORIGIN` is separate from the external product URL. When present, the build writes canonical and Open Graph URLs, EN/RU/zh-Hant/x-default alternatives and a sitemap containing every localized route URL. `APCO_SITE_INDEXABLE=true` requires a valid HTTPS origin; invalid values fail the build. The 404 page always remains `noindex, nofollow`, including after client navigation. The review copy should keep `APCO_SITE_INDEXABLE=false`.

For an indexable final root-domain deployment:

```sh
APCO_PUBLIC_SITE_ORIGIN=https://www.example.com APCO_SITE_INDEXABLE=true npm run build:root
```

These variables may also be provided by a local `.env` or the hosting build environment. Client navigation updates canonical, Open Graph URL and indexing metadata to match the current route. On a project Pages site, `/apcoseb-clear/robots.txt` is not the origin's root `robots.txt`; route-level robots meta tags enforce the review copy's noindex policy. Configure origin-level crawler rules through the receiving host when required.

## GitHub Pages release gate

After Pages is configured to use GitHub Actions, a push to `main` runs `.github/workflows/deploy.yml` and publishes only after these checks succeed for that revision:

1. Resolve the common repository base and marketing origin.
2. Install locked dependencies, audit dependencies, run the complete source checks, build and run the full Chromium release contract.
3. Build the same destination in separate Firefox and WebKit jobs and run the full release contract in each engine. Both matrix jobs are required; neither is cancelled merely because the other fails.
4. Deploy the validated static artifact to Pages.
5. Run the full Chromium release contract against the actual URL returned by the Pages deployment.

Pull requests run the same three-browser validation without publishing. Their `handoff-package` job then checks the exported source at a renamed subpath, at `/`, and with custom product destinations. A manual dispatch on `main` uses the same release gates; a manual dispatch on another branch validates without publishing. The separate `Cross-browser UX review` workflow is available for a manual three-engine review of a chosen branch. Pull requests already receive this browser coverage from the release workflow.

Every browser job installs Traditional Chinese fonts. Jobs retain their own test reports, screenshots and failure traces under distinct artifact names. A successful build alone does not establish a successful deployment: require the intended commit, all browser gates, `deploy` and `production-smoke` to succeed in the same release run. These instructions describe the workflow; they do not assert that the current working copy has been pushed or deployed.

Public product settings come from repository variables `VITE_APCO_PRODUCT_URL`, `VITE_APCO_SUPPORT_EMAIL` and `VITE_APCO_SIGN_IN_URL`. Unset values use the defaults documented in [Handoff](HANDOFF.md). Documentation stays within the localized site at `/developers/api/docs`; it has no external destination override. Set `APCO_PUBLIC_SITE_ORIGIN` and `APCO_SITE_BASE=/` when moving to a custom root domain. None of these variables is a secret store; do not place API keys in `VITE_*` settings.

## Other hosts

Vercel's root build and `dist` directory are versioned in `vercel.json`; its SPA rewrite remains for client routes. Use the same public variables in the hosting build environment. Review deployments may be protected by the hosting project. Keep temporary share URLs out of committed documentation.

Vercel sets conservative `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` headers from `vercel.json`. GitHub Pages does not read this config; configure response headers through the receiving host or edge proxy there. A restrictive CSP must account for the inline first-paint theme script and the optional native/Canvas motion. Verify the resulting policy on the full site before enabling it.

The no-JavaScript search link is generated by the Vite HTML transform from `VITE_APCO_PRODUCT_URL`; it follows the configured product origin when the site changes repository or domain.

## Verify the deployed version

```sh
APCO_BASE_URL=https://example.com/ npm run test:production
```

For this repository's default Pages destination, use `https://imonsergey.github.io/apcoseb-clear/`. The test URL must end with `/` and match the deployed base. For a local custom build, run `APCO_TEST_BASE_PATH=/site/ npm run test:release` after building with `--base=/site/`. `test:release` and `test:production` run the complete Chromium contract. `npm test` runs the complete contract in all three engines; `test:cross-browser` is the smaller focused interaction suite.

Check deep-link refreshes, locale changes, theme preference, menus, search, pricing handoff and Contact output on the final hostname. Public indexing, domain ownership, external product integrations and legal/commercial approval are separate release inputs described in [Handoff](HANDOFF.md).

## Rollback

Find the last accepted commit and its successful workflow. Revert the problematic commit on top of current `main`, then pass the same checks and publish normally. Avoid force-pushing shared history. For urgent hosting rollback, select the previously verified deployment in the owner's hosting account and then reconcile Git. Verify the published content and smoke job, not only the branch SHA.

## Transfer

Use `npm run handoff:package` to export clean committed source without Git history. Initialize a new repository after extraction instead of copying the existing `.git` directory. Preserve dependency locks and third-party notices. Configure destination account permissions, public environment values and CI separately. Do not copy `.env`, authentication material, `node_modules` or local test output.
