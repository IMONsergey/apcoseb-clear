# Documentation index

## Current operating guides

Start with [Handoff](HANDOFF.md) for setup and product boundaries. [Product integrations](reference/PRODUCT-INTEGRATIONS.md) records the pricing and API sources. Build, test and publication results are attached to each commit in [GitHub Actions](https://github.com/IMONsergey/apcoseb-clear/actions).

| Guide                           | Purpose                                                             |
| ------------------------------- | ------------------------------------------------------------------- |
| [Handoff](HANDOFF.md)           | First session, ownership, integration boundaries and source package |
| [Migration](MIGRATION.md)       | Clean source transfer and destination-specific release verification |
| [Architecture](ARCHITECTURE.md) | Runtime structure, editing map and CSS order                        |
| [Deployment](DEPLOYMENT.md)     | Hosting bases, public configuration, verification and rollback      |
| [QA](QA.md)                     | Browser suites, release gates and measurement limits                |
| [Site grid](SITE-GRID.md)       | Shared rails, typography and responsive layout contract             |
| [Assets](ASSETS.md)             | Asset families, theme pairs, licenses and editing rules             |
| [Visuals](VISUALS.md)           | Native/Canvas animation lifecycle and protected source files        |
| [Content](CONTENT.md)           | Product copy and owner approval inputs                              |

- [Style ownership and reuse](STYLES.md)
- [Localization and translation release gates](LOCALIZATION.md)

## Legal source files

`legal-sources/` contains the unchanged English legal Markdown documents. `legal-translations/` supplies complete Russian and Traditional Chinese reference translations, with matching English originals available through the language selector. The build checks hashes, editions, structure, numbers, URLs and compiled output. Amend legal terms only with approval from their owner; do not edit generated JSON directly.
