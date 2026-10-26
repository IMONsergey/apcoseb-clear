import { use } from 'react';
import { useReadingPosition } from '../hooks/useReadingPosition';
import { supportEmail } from '../config/site';
import { siteHref } from '../app/paths';
import { legalRoutes } from '../content/legal-routes';
import type { LegalDocument as LegalPolicy } from '../content/legal-types';
import { loadLegalDocuments } from '../i18n/legal-documents';
import { useLocale } from '../i18n/context';
import { AnimatedDetails } from '../components/ui/AnimatedDetails';
import { DoubleButton } from '../components/ui/DoubleButton';
import '../styles/legal-pages.css';

export default function LegalPages({ path }: { path: string }) {
  const { locale } = useLocale();
  const documents = use(loadLegalDocuments(locale));
  const document = documents[path as keyof typeof documents];
  const route = legalRoutes.find((item) => item.path === path);
  if (!document || !route) return null;
  return <LegalDocument key={locale + path} path={path} document={document} route={route} />;
}

function LegalDocument({
  path,
  document: policy,
  route,
}: {
  path: string;
  document: LegalPolicy;
  route: (typeof legalRoutes)[number];
}) {
  const { locale, t } = useLocale();
  // Discretionary breaks affect only visible labels, never source text or metadata.
  const title = (value: string) =>
    locale === 'ru'
      ? t(value).replaceAll(
          'конфиденциальности',
          'кон\u00adфи\u00adден\u00adци\u00adаль\u00adно\u00adсти',
        )
      : t(value);
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(policy.updatedISO + 'T00:00:00Z'),
  );
  const active = useReadingPosition(
    policy.headings.filter(({ level }) => level === 2).map(({ id }) => id),
  );
  const contents = (
    <nav aria-label={t('On this page')}>
      <ol>
        {policy.headings
          .filter(({ level }) => level === 2)
          .map(({ id, title }) => (
            <li key={id}>
              <a href={'#' + id} aria-current={active === id ? 'location' : undefined}>
                {title}
              </a>
            </li>
          ))}
      </ol>
    </nav>
  );
  // HTML is compiled from reviewed, repository-owned Markdown; no runtime remote content.
  const html = policy.html.replace(
    /href="(\/legal\/[^"]+)"/g,
    (_match, href: string) => `href="${siteHref(href)}"`,
  );
  return (
    <article className="legal-page">
      <div className="container">
        <header className="legal-header" id="document-top">
          <div className="legal-header__copy">
            <h1>{title(route.title)}</h1>
            <p className="legal-description">{t(route.description)}</p>
            <p className="legal-updated">
              {t('Last updated')} <time dateTime={policy.updatedISO}>{updated}</time>
            </p>
          </div>
          <div className="legal-tools">
            <DoubleButton variant="secondary" compact onClick={() => window.print()}>
              {t('Print document')}
            </DoubleButton>
            {path === '/legal/cookie-policy' && (
              <DoubleButton
                compact
                onClick={() => window.dispatchEvent(new Event('apcosys:cookie-preferences'))}
              >
                {t('Cookie Preferences')}
              </DoubleButton>
            )}
          </div>
        </header>
        <nav className="legal-documents" aria-label={t('Legal documents')}>
          {legalRoutes.map((item) => (
            <a
              key={item.path}
              href={siteHref(item.path)}
              aria-current={item.path === path ? 'page' : undefined}
            >
              {title(item.title)}
            </a>
          ))}
        </nav>
        <div className="legal-mobile-contents">
          <AnimatedDetails title="On this page">{contents}</AnimatedDetails>
        </div>
        <div className="legal-layout">
          <aside className="legal-sidebar">
            <p>{t('On this page')}</p>
            {contents}
          </aside>
          <div className="legal-reading">
            <div className="legal-copy" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="legal-end">
              <a href="#document-top">{t('Back to top')}</a>
              <a href={'mailto:' + supportEmail}>
                {t('Questions? {email}', { email: supportEmail })}
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
