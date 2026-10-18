import type { SitePath } from '../../content/routes';
import { Text } from '../ui/Text';
import type { ThemedAsset, EditorialAsset } from '../../content/assets';
import type { ReactNode } from 'react';
import { siteHref } from '../../app/paths';
import { ThemedArtwork } from '../ui/ThemedArtwork';
import { useLocale } from '../../i18n/context';

type EditorialMedia = { file: EditorialAsset; alt: string };

export function EditorialHeading({
  title,
  intro,
  id,
}: {
  title: string;
  intro?: string;
  id?: string;
}) {
  return (
    <div className="editorial-heading">
      <Text as="h2" id={id}>
        {title}
      </Text>
      {intro && <Text as="p">{intro}</Text>}
    </div>
  );
}

export function EditorialSection({
  id,
  title,
  intro,
  children,
  className = '',
  media,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  media?: EditorialMedia;
}) {
  const { t } = useLocale();
  return (
    <section
      id={id}
      className={'editorial-section section-space ' + className}
      aria-labelledby={id + '-title'}
    >
      <div className="container">
        <div
          className={
            media ? 'editorial-opening editorial-opening--illustrated' : 'editorial-opening'
          }
        >
          <EditorialHeading id={id + '-title'} title={title} {...(intro ? { intro } : {})} />
          {media && (
            <figure className="editorial-media">
              <ThemedArtwork
                asset={media.file}
                sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1520px) calc(50vw - 60px), 700px"
                width="1200"
                height="800"
                loading="lazy"
                decoding="async"
                alt={t(media.alt)}
              />
            </figure>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ReadingRows({
  items,
  numbered = false,
}: {
  items: readonly { title: string; text: string; detail?: string }[];
  numbered?: boolean;
}) {
  return (
    <div
      className={
        'reading-rows reading-rows--' +
        items.length +
        (numbered ? ' reading-rows--numbered' : '') +
        (items.some((item) => item.detail) ? ' reading-rows--with-details' : '')
      }
    >
      {items.map((item, i) => (
        <article className="reading-row" key={item.title}>
          {numbered && (
            <span className="reading-row__number" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
          )}
          <Text as="h3">{item.title}</Text>
          <Text as="p">{item.text}</Text>
          {item.detail && (
            <Text as="p" className="reading-row__detail">
              {item.detail}
            </Text>
          )}
        </article>
      ))}
    </div>
  );
}

export function FeatureColumns({
  items,
}: {
  items: readonly { title: string; text: string; detail?: string }[];
}) {
  const { t } = useLocale();
  return (
    <div
      className={
        'feature-columns' +
        (items.some((item) => item.detail) ? ' feature-columns--with-details' : '')
      }
    >
      {items.map((item) => (
        <article key={item.title}>
          <Text as="h3">{item.title}</Text>
          <Text as="p">{item.text}</Text>
          {item.detail && <span className="feature-columns__detail">{t(item.detail)}</span>}
        </article>
      ))}
    </div>
  );
}

export function RelatedReading({
  items,
}: {
  items: readonly { title: string; text: string; path: SitePath }[];
}) {
  const { t } = useLocale();
  return (
    <div className="related-reading">
      {items.map((item) => (
        <a key={item.path} href={siteHref(item.path)}>
          {relatedArtwork[item.path] && (
            <ThemedArtwork
              className="related-reading__image"
              asset={relatedArtwork[item.path]!}
              alt=""
              width="960"
              height="640"
              loading="lazy"
              decoding="async"
            />
          )}
          <Text as="h3">{item.title}</Text>
          <Text as="p">{item.text}</Text>
          <span>{t('Explore')}</span>
        </a>
      ))}
    </div>
  );
}

const relatedArtwork: Partial<Record<SitePath, ThemedAsset>> = {
  '/platform/search-investigation': 'inner/search.webp',
  '/platform/data-methodology': 'inner/methodology.webp',
  '/developers/api': 'inner/api.webp',
};
