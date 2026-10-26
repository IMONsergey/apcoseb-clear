# Moving Apcosys to a new repository

This source can be transferred without its development history. Keep the source, lockfile, legal documents, tests, assets, notices and maintained documentation together.

## Prepare a source snapshot

From a clean, verified working tree:

```sh
npm ci
npm run check
npm run build
npm run test:release
npm run handoff:package
```

The resulting ZIP in `.work/` has an `apcosys-web/` root and contains no `.git` directory, archived design-review reports or source-commit marker. Record the accepted commit and CI result outside the new repository for traceability.

The `handoff-package` CI job independently verifies the extracted source at `/recipient-site/` and `/` with `test:relocation`, including 404 recovery and localized font delivery, then uploads the clean source ZIP as a workflow artifact. Select the artifact from the **accepted, successful** pull-request run; an in-progress or cancelled run is not release evidence.

Extract it to an empty directory and initialize a new Git repository. Do not copy `.git`, `.env`, local dependencies, build output, preview screenshots or temporary performance reports from the old project. Do not rewrite font, engine or third-party license notices.

## Initialize the destination repository

After extracting the approved ZIP and entering its `apcosys-web/` directory, create an **empty** repository in the receiving owner's GitHub account (without a generated README, license or .gitignore). When GitHub Pages will host the site, enable **Settings → Pages → GitHub Actions** in the receiving repository. A push to `main` validates the code in Chromium, Firefox and WebKit before publishing, then checks the actual Pages URL. An explicit `workflow_dispatch` is also supported; only a run on `main` publishes. Pull requests and manual runs on other branches validate without publication. For a Vercel-only destination, the receiving owner can disable the Pages publishing jobs while retaining validation. Then:

```sh
git init -b main
git add .
git commit -m "Initial Apcosys website handoff"
git remote add origin <recipient-repository-git-url>
git push -u origin main
```

The receiving owner must provision the repository, account permissions and hosting; the source archive intentionally carries none of the original Git history, local credentials or deployment ownership. Confirm that the new repository contains only the initial import commit before connecting production hosting.

## Configure hosting

- **GitHub project Pages:** the workflow computes `/<repository-name>/` automatically. User/organization Pages repositories use `/`.
- **Root domain:** set the GitHub Actions repository variable `APCO_SITE_BASE=/`; ensure the host serves route directories and the SPA fallback correctly.
- **Vercel:** `vercel.json` builds at `/`. Connect the new repository and confirm its environment values and access protection.
- **Other subpath:** use `npm run build -- --base=/site/` and host the `dist/` contents at that exact path.

Public product URLs and contact settings belong in the hosting environment; see `.env.example`. Set `APCO_PUBLIC_SITE_ORIGIN` to the final verified HTTPS origin to generate canonical and Open Graph URLs. Do not put secrets in `VITE_*` values. Preview robots/noindex settings must remain until the site is explicitly approved for indexing.

## Verify the new location

```sh
npm ci
npm run check
npm run build -- --base=/new-repo/
APCO_TEST_BASE_PATH=/new-repo/ npm run test:release
APCO_TEST_BASE_PATH=/new-repo/ npm run test:cross-browser
```

For a deployed instance, run `APCO_BASE_URL=https://your-host/new-repo/ npm run test:production`. Verify direct navigation and refresh of all routes, search handoff, pricing, contact, legal links, both themes, animated sections and keyboard/mobile behavior. Recheck the external product links and actual contract with the product owner before a public launch.

Keep the original SVG wordmark and approved light/dark artwork intact. The marketing site is separate from the authenticated SaaS: its API examples and monitoring remain demonstrations, and its contact form currently creates an email draft rather than submitting to a service.
