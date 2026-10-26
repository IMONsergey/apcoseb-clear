import '../../styles/compact-experience.css';
import { useState } from 'react';
import { siteHref } from '../../app/paths';
import { DataLens, SearchFragment, HostFragment } from '../product/CompactFragments';
import { TeamSignal } from '../product/TeamSignal';
import { DoubleButton } from '../ui/DoubleButton';
import { ThemedArtwork } from '../ui/ThemedArtwork';
import { demoBucket, demoHosts } from '../../content/product-demo';
import '../../styles/home-product.css';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

const searchable = [
  {
    label: 'Hosts',
    description: 'Find internet-facing systems that match your query.',
    mode: 'host',
  },
  {
    label: 'Domains',
    description: 'Search and investigate observed domain data.',
    mode: 'results',
  },
  {
    label: 'Ports & Services',
    description: 'See exposed ports and the services observed behind them.',
    mode: 'services',
  },
  {
    label: 'Technologies',
    description: 'Explore detected products and technologies.',
    mode: 'services',
  },
  {
    label: 'Vulnerability Context',
    description: 'Examine CVEs potentially associated with observed technologies and versions.',
    mode: 'cve',
  },
] as const;

export function SearchableSection() {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState(0);
  return (
    <section
      id="what-you-can-search"
      className="home-searchable section-space"
      aria-labelledby="searchable-title"
    >
      <div className="container">
        <div className="home-product-heading">
          <h2 id="searchable-title">
            {locale === 'en' ? (
              <>
                Search the infrastructure <br />
                behind the internet.
              </>
            ) : (
              <LocaleText>{t('Search the infrastructure behind the internet.')}</LocaleText>
            )}
          </h2>
        </div>
        <div className="home-searchable__layout">
          <div
            className="home-searchable__index"
            role="group"
            aria-label={t('Searchable data types')}
          >
            {searchable.map((item, i) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="searchable-selector" aria-hidden="true" />
                <span>
                  <strong>{t(item.label)}</strong>
                  <small>{t(item.description)}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="home-searchable__evidence">
            <DataLens selected={selected} />
            <DoubleButton compact href={siteHref('/platform/data-methodology')}>
              {t('Explore Data & Methodology')}
            </DoubleButton>
          </div>
        </div>
      </div>
    </section>
  );
}

const cases = [
  {
    artwork: 'use-cases/bug-bounty.webp',
    title: 'Bug Bounty',
    outcome: 'Find candidate infrastructure. Verify permission before testing.',
    path: '/use-cases/bug-bounty',
    label: 'Explore Bug Bounty',
  },
  {
    artwork: 'use-cases/vulnerability-research.webp',
    title: 'Vulnerability Research',
    outcome: 'Find matching versions. Check whether the advisory applies.',
    path: '/use-cases/vulnerability-research',
    label: 'Explore Vulnerability Research',
  },
  {
    artwork: 'use-cases/osint.webp',
    title: 'OSINT & Threat Investigation',
    outcome: 'Examine services and host context. Identify the next research lead.',
    path: '/use-cases/osint-threat-investigation',
    label: 'Explore OSINT',
  },
] as const;
export function HomeUseCases() {
  const { locale, t } = useLocale();
  return (
    <section
      className="home-usecases section-space"
      id="use-cases"
      aria-labelledby="home-cases-title"
    >
      <div className="container">
        <div className="home-product-heading">
          <h2 id="home-cases-title">
            {locale === 'en' ? (
              <>
                Different questions. <br />
                One place to investigate them.
              </>
            ) : (
              <LocaleText>{t('Different questions. One place to investigate them.')}</LocaleText>
            )}
          </h2>
        </div>
        <div className="home-usecases__grid">
          {cases.map((item) => (
            <article key={item.title}>
              <a
                className="home-usecases__image"
                href={siteHref(item.path)}
                aria-label={t(item.label)}
                tabIndex={-1}
              >
                <ThemedArtwork
                  asset={item.artwork}
                  alt=""
                  width="1536"
                  height="1024"
                  loading="lazy"
                />
              </a>
              <div className="home-usecases__story">
                <h3>{t(item.title)}</h3>
                <p>{t(item.outcome)}</p>
                <DoubleButton variant="secondary" compact href={siteHref(item.path)}>
                  {t(item.label)}
                </DoubleButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
const capabilityNotes = [
  [
    ['Start with what you know', 'An address, domain or product name.'],
    ['Follow the result', 'Open a host to inspect its service evidence.'],
  ],
  [
    ['Narrow the view', 'Keep only the protocol relevant to your question.'],
    ['Keep the context', 'The host and its other observations remain connected.'],
  ],
  [
    ['Read the response', 'Inspect what the service actually returned.'],
    ['Check the detection', 'Compare the reported product with its evidence.'],
  ],
  [
    ['Locate the bucket', 'See the storage host and container behind the files.'],
    ['Inspect the records', 'Compare file paths, formats and sizes.'],
  ],
  [
    ['Use structured data', 'Bring supported observations into your workflow.'],
    ['Connect your tools', 'Work with the documented request and response format.'],
  ],
];
const capabilities = [
  {
    label: 'Search',
    title: 'Start with a technical attribute.',
    text: 'Find matching hosts, then inspect their ports and service responses.',
    mode: 'query',
  },
  {
    label: 'Filter',
    title: 'Focus on the relevant service.',
    text: 'Filter results by service.',
    mode: 'services',
  },
  {
    label: 'Host View',
    title: 'Read the evidence in context.',
    text: 'Ports, services and detected versions belong to one selected host.',
    mode: 'host',
  },
  {
    label: 'Buckets',
    title: 'Explore files in context.',
    text: 'Group matching files by bucket and inspect their metadata.',
    mode: 'host',
  },
  {
    label: 'API',
    title: 'Continue in your own tools.',
    text: 'Take supported search and host data into scripts and internal workflows.',
    mode: 'host',
  },
] as const;

function CapabilityResponse() {
  const { t } = useLocale();
  const host = demoHosts[0]!;
  const services = host.services
    .map(
      (service) =>
        `    { "protocol": ${JSON.stringify(service.protocol.toLowerCase())}, "port": ${service.port} }`,
    )
    .join(',\n');
  const snippet = `{\n  "ip": "${host.ip}",\n  "open_ports": [\n${services}\n  ]\n}`;
  return (
    <div className="capability-record capability-record--api">
      <div className="capability-record__bar">
        <span>{t('Host context')}</span>
        <code>JSON</code>
      </div>
      <pre>
        <code>
          {snippet.split(/("(?:\\.|[^"\\])*"\s*:?|\b\d+\b)/g).map((token, index) => (
            <span
              key={index}
              className={
                token.endsWith(':')
                  ? 'capability-code-key'
                  : token.startsWith('"')
                    ? 'capability-code-string'
                    : /^\d+$/.test(token)
                      ? 'capability-code-number'
                      : undefined
              }
            >
              {token}
            </span>
          ))}
        </code>
      </pre>
      <div className="capability-record__summary">
        <span>{t('Services')}</span>
        <div>
          {host.services.map((service) => (
            <code key={service.port}>
              {service.port} / {service.protocol}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesSection() {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [httpsOnly, setHttpsOnly] = useState(false);
  const fileSize = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  return (
    <section
      className="home-capabilities section-space"
      id="capabilities"
      aria-labelledby="capabilities-title"
    >
      <div className="container">
        <div className="home-product-heading">
          <h2 id="capabilities-title">{t('The tools to go deeper.')}</h2>
        </div>
        <div
          className="home-capabilities__tabs"
          role="group"
          aria-label={t('Investigation capabilities')}
        >
          {capabilities.map((cap, i) => (
            <button
              type="button"
              key={cap.label}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>0{i + 1}</span>
              {t(cap.label)}
            </button>
          ))}
        </div>
        <div className="home-capabilities__panels">
          {capabilities.map((item, index) => (
            <div
              key={item.label}
              className="home-capabilities__stage"
              aria-hidden={selected !== index}
              inert={selected !== index}
            >
              <div className="home-capabilities__copy">
                <h3>{t(item.title)}</h3>
                <p>{t(item.text)}</p>
                <div className="capability-notes">
                  {capabilityNotes[index]!.map(([title, text], i) => (
                    <div className="capability-notes__tile" key={title}>
                      <span className="capability-notes__mark" aria-hidden="true">
                        {i === 0 ? '01' : '02'}
                      </span>
                      <div>
                        <h4>{t(title!)}</h4>
                        <p>{t(text!)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <DoubleButton
                  variant="primary"
                  compact
                  href={siteHref(
                    index === 3
                      ? '/developers/api#api-capabilities'
                      : index === 4
                        ? '/developers/api'
                        : '/platform/search-investigation',
                  )}
                >
                  {t(
                    index === 3
                      ? 'Explore bucket search via API'
                      : index === 4
                        ? 'Explore API integration'
                        : 'Explore Search & Investigation',
                  )}
                </DoubleButton>
              </div>
              <div className="home-capabilities__screen">
                {index === 1 ? (
                  <div className="capability-record">
                    <div className="capability-record__bar">
                      <span>{t('SERVICE FILTER')}</span>
                      <label>
                        <input
                          type="checkbox"
                          checked={httpsOnly}
                          onChange={(e) => setHttpsOnly(e.target.checked)}
                        />
                        {t('HTTPS only')}
                      </label>
                    </div>
                    {demoHosts.map((host) => (
                      <div className="capability-record__host" key={host.ip}>
                        <strong>{host.ip}</strong>
                        <span>{host.hostname}</span>
                        {host.services.map((s) => (
                          <p key={s.port} aria-hidden={httpsOnly && s.protocol !== 'HTTPS'}>
                            <code>
                              {s.port} / {s.protocol}
                            </code>
                            <span>{s.technology}</span>
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : index === 3 ? (
                  <div className="capability-record">
                    <div className="capability-record__bar">
                      <span>{t('Example bucket')}</span>
                      <span>
                        {demoBucket.host}/{demoBucket.container}
                      </span>
                    </div>
                    {demoBucket.files.map((file) => (
                      <div className="capability-record__host" key={file.key}>
                        <strong>{file.key.split('/').at(-1)}</strong>
                        <span>{file.key}</span>
                        <p>
                          <code>{file.extension.toUpperCase()}</code>
                          <span>{t('{size} MB', { size: fileSize.format(file.sizeMb) })}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : index === 4 ? (
                  <CapabilityResponse />
                ) : index === 0 ? (
                  <SearchFragment />
                ) : (
                  <HostFragment />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function SecurityTeamsCTA() {
  const { locale, t } = useLocale();
  return (
    <section className="home-team-cta" aria-labelledby="team-evaluation-title">
      <div className="container home-team-cta__layout">
        <div className="home-team-cta__copy">
          <h2 id="team-evaluation-title">
            {locale === 'en' ? (
              <>
                Evaluating Apcosys <br />
                for your security team?
              </>
            ) : (
              <LocaleText>{t('Evaluating Apcosys for your security team?')}</LocaleText>
            )}
          </h2>
          <p>
            {t(
              'Tell us about your investigation workflows, data requirements and API needs. Find the right way to evaluate Apcosys with your team.',
            )}
          </p>
          <div className="home-team-cta__actions">
            <DoubleButton variant="inverse" href={siteHref('/contact')}>
              {t('Talk to Us')}
            </DoubleButton>
            <DoubleButton variant="inverse" href={siteHref('/teams')}>
              {t('Explore Security Teams')}
            </DoubleButton>
          </div>
        </div>
        <div className="home-team-cta__art">
          <TeamSignal inverse />
        </div>
      </div>
    </section>
  );
}
