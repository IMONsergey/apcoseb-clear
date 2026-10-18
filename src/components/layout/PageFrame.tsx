import { Text } from '../ui/Text';
import '../../styles/page-components.css';
import '../../styles/compact-experience.css';
import '../../styles/inner-pages.css';
import { PageArtwork, type ArtworkKey } from './PageArtwork';
import { useRef, type ReactNode } from 'react';
import { useReadingPosition } from '../../hooks/useReadingPosition';
import { usePageMotion } from '../../hooks/usePageMotion';
import { DoubleButton } from '../ui/DoubleButton';
import { useLocale } from '../../i18n/context';

export type PageLink = { label: string; href: string; secondary?: boolean };

function PageIntro({
  title,
  description,
  concept = false,
  artwork,
  actions,
}: {
  title: string;
  description: string;
  concept?: boolean;
  artwork?: ArtworkKey | undefined;
  actions?: readonly PageLink[] | undefined;
}) {
  return (
    <header className="stage-page-hero">
      <div className="container stage-page-hero__grid">
        <div className="stage-page-hero__copy">
          <div className="stage-page-hero__title">
            <Text as="h1">{title}</Text>
          </div>
          <div className="stage-page-hero__aside">
            <Text as="p" className="stage-page-hero__description">
              {description}
            </Text>
            {concept && (
              <Text as="p" className="stage-concept-label">
                Concept demonstration · Not a live product capability
              </Text>
            )}
          </div>
          {actions && <PageAction links={actions} />}
        </div>
        {artwork && <PageArtwork kind={artwork} />}
      </div>
    </header>
  );
}

export function PageAction({ links }: { links: readonly PageLink[] }) {
  const { t } = useLocale();
  return (
    <div className="stage-actions">
      {links.map(({ label, href, secondary }) => (
        <DoubleButton
          key={href + label}
          href={href}
          {...(secondary ? { variant: 'secondary' as const } : {})}
        >
          {t(label)}
        </DoubleButton>
      ))}
    </div>
  );
}

export function PageFrame({
  title,
  description,
  children,
  links,
  heroLinks,
  variant = 'editorial',
  concept = false,
  artwork,
  sections,
  closing,
}: {
  title: string;
  description: string;
  children: ReactNode;
  links?: readonly PageLink[];
  heroLinks?: readonly PageLink[];
  variant?: 'editorial' | 'technical' | 'product' | 'commercial' | 'usecase' | 'developer';
  concept?: boolean;
  artwork?: ArtworkKey;
  sections?: readonly { label: string; id: string }[];
  closing?: { title: string; description: string };
}) {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);
  usePageMotion(root, title);
  const activeSection = useReadingPosition(sections?.map(({ id }) => id) ?? []);
  return (
    <article
      ref={root}
      className={'stage-page inner-pages stage-page--' + variant}
      data-page={artwork}
    >
      <PageIntro
        title={title}
        description={description}
        concept={concept}
        artwork={artwork}
        actions={heroLinks ?? links?.slice(0, 2)}
      />
      {sections && (
        <nav className="page-contents container" aria-label={t('On this page')}>
          {sections.map(({ label, id }) => (
            <a
              key={id}
              href={'#' + id}
              aria-current={activeSection === id ? 'location' : undefined}
            >
              {t(label)}
            </a>
          ))}
        </nav>
      )}
      {children}
      {links && (
        <nav className="stage-related" aria-label={t('Continue exploring Apcosys')}>
          <div className="container stage-related__inner">
            {closing && (
              <div className="page-closing-copy">
                <Text as="h2">{closing.title}</Text>
                <Text as="p">{closing.description}</Text>
              </div>
            )}
            <div className="stage-related__links">
              {links.map(({ label, href, secondary }, index) => (
                <DoubleButton
                  variant={closing && index === 0 && !secondary ? 'primary' : 'secondary'}
                  compact
                  href={href}
                  key={href + label}
                >
                  {t(label)}
                </DoubleButton>
              ))}
            </div>
          </div>
        </nav>
      )}
    </article>
  );
}

export function Notice({ children }: { children: string }) {
  const { t } = useLocale();
  return (
    <aside className="stage-note" role="note">
      {t(children)}
    </aside>
  );
}
