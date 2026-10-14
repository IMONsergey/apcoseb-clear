import { useReadingPosition } from '../hooks/useReadingPosition';
import { supportEmail } from '../config/site';
import { siteHref } from '../app/paths';
import { legalRoutes } from '../content/legal-routes';
import documents from '../content/legal-documents.json';
import { AnimatedDetails } from '../components/ui/AnimatedDetails';
import { DoubleButton } from '../components/ui/DoubleButton';
import '../styles/legal-pages.css';

export default function LegalPages({ path }: { path: string }) {
  const document = documents[path as keyof typeof documents];
  const route = legalRoutes.find((item) => item.path === path);
  if (!document || !route) return null;
  return <LegalDocument key={path} path={path} document={document} route={route} />;
}

function LegalDocument({
  path,
  document: policy,
  route,
}: {
  path: string;
  document: (typeof documents)[keyof typeof documents];
  route: (typeof legalRoutes)[number];
}) {
  const active = useReadingPosition(
    policy.headings.filter(({ level }) => level === 2).map(({ id }) => id),
  );
  const contents = (
    <nav aria-label="On this page">
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
            <h1>{route.title}</h1>
            <p className="legal-description">{route.description}</p>
            <p className="legal-updated">
              Last updated <time dateTime={policy.updatedISO}>{policy.updated}</time>
            </p>
          </div>
          <div className="legal-tools">
            <DoubleButton variant="secondary" compact onClick={() => window.print()}>
              Print document
            </DoubleButton>
            {path === '/legal/cookie-policy' && (
              <DoubleButton
                compact
                onClick={() => window.dispatchEvent(new Event('apcosys:cookie-preferences'))}
              >
                Cookie Preferences
              </DoubleButton>
            )}
          </div>
        </header>
        <nav className="legal-documents" aria-label="Legal documents">
          {legalRoutes.map((item) => (
            <a
              key={item.path}
              href={siteHref(item.path)}
              aria-current={item.path === path ? 'page' : undefined}
            >
              {item.title}
            </a>
          ))}
        </nav>
        <div className="legal-mobile-contents">
          <AnimatedDetails title="On this page">{contents}</AnimatedDetails>
        </div>
        <div className="legal-layout">
          <aside className="legal-sidebar">
            <p>On this page</p>
            {contents}
          </aside>
          <div className="legal-reading">
            <div className="legal-copy" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="legal-end">
              <a href="#document-top">Back to top</a>
              <a href={'mailto:' + supportEmail}>Questions? {supportEmail}</a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
