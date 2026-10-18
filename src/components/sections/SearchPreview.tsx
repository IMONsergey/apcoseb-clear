import { ProductEvidence, type EvidenceScenario } from '../product/ProductEvidence';
import { demoScenarios } from '../../content/product-demo';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { noBreakNumber } from '../../i18n/typography';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { metrics } from '../../content/metrics';
import { productUrl } from '../../config/site';
import { SearchChrome } from './SearchChrome';
import { TrustMarquee } from './TrustMarquee';
import { Icon } from '../ui/Icon';
import { Visual } from '../visuals/Visual';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSearchEntrance } from '../../hooks/useSearchEntrance';

function SearchForm({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  const compact = useMediaQuery('(max-width: 1199px)');
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const restore = () => setSubmitting(false);
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    const normalized = query.trim();
    if (!normalized) {
      event.preventDefault();
      setError(true);
      input.current?.focus();
      return;
    }
    if (submitting) {
      event.preventDefault();
      return;
    }
    if (input.current) input.current.value = normalized;
    setQuery(normalized);
    setError(false);
    setSubmitting(true);
  }
  return (
    <form
      className={`search-form ${className}${error ? ' search-form--invalid' : ''}`}
      action={`${productUrl}/search`}
      method="get"
      onSubmit={submit}
      aria-busy={submitting || undefined}
      role="search"
      aria-label={t('Search internet infrastructure')}
    >
      <span className="search-form__glow" aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        {t('Domain, IP or technical attribute')}
      </label>
      <input
        id={id}
        ref={input}
        enterKeyHint="search"
        type="search"
        name="search_value"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setError(false);
        }}
        placeholder={t(
          compact ? 'Domain, IP or attribute' : 'Domain, IP or technical attribute. It’s free',
        )}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error || undefined}
        aria-describedby={
          [compact && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
      />
      {!compact && !query && (
        <span className="search-desktop-placeholder" aria-hidden="true">
          <span>{t('Domain, IP or technical attribute.')}</span>
          <span className="search-desktop-placeholder__accent">{t('It’s free')}</span>
        </span>
      )}
      {query && !submitting && (
        <button
          type="button"
          className="search-clear"
          aria-label={t('Clear search query')}
          onClick={() => {
            setQuery('');
            setError(false);
            input.current?.focus({ preventScroll: true });
          }}
        >
          <Icon name="close" />
        </button>
      )}
      <button
        type="submit"
        className="search-submit"
        aria-label={t('Search Apcosys')}
        disabled={submitting}
      >
        {submitting ? (
          <span className="search-spinner" aria-hidden="true" />
        ) : (
          <Icon name="search" />
        )}
      </button>
      {compact && (
        <span className="search-free-note" id={`${id}-hint`}>
          <LocaleText>{t('It’s free')}</LocaleText>
        </span>
      )}
      {error && (
        <span className="search-error" id={`${id}-error`} role="alert">
          <LocaleText>{t('Enter a domain, IP or technical attribute.')}</LocaleText>
        </span>
      )}
    </form>
  );
}
export function SearchPreview() {
  const { t } = useLocale();
  const scene = useSearchEntrance();
  const [scenario, setScenario] = useState<EvidenceScenario>('domain');
  return (
    <section className="search-preview" aria-label={t('Try Apcosys public search')}>
      <Visual kind="flow" eager />
      <Visual kind="dots" eager />
      <div className="summary-wrap">
        <dl className="container summary-grid">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <dt>
                <LocaleText>{t(metric.label)}</LocaleText>
              </dt>
              <dd>{noBreakNumber(metric.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="container search-preview__inner">
        <div ref={scene} className="search-scene">
          <SearchChrome />
          <div className="search-chrome__fog" aria-hidden="true" />
          <div className="search-scene__content">
            <div className="search-scene__heading">
              <h2>
                <span className="search-title-desktop">
                  <LocaleText>{t('One query. A closer look.')}</LocaleText>
                </span>
              </h2>
            </div>
            <SearchForm />
            <div className="search-examples" role="group" aria-label={t('Example investigations')}>
              <span>{t('Explore an example')}</span>
              {Object.entries(demoScenarios).map(([key, example]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={scenario === key}
                  onClick={() => setScenario(key as EvidenceScenario)}
                >
                  {t(example.label)}
                </button>
              ))}
            </div>
            <div className="search-scene__results">
              <ProductEvidence scenario={scenario} compact embedded showPlaybackStatus={false} />
            </div>
            <p className="search-scene__demo-note">
              <LocaleText>{t('Synthetic demonstration · No live observations.')}</LocaleText>{' '}
              <a href={productUrl + '/search'}>
                <LocaleText>{t('Open product search')}</LocaleText>
              </a>
            </p>
          </div>
        </div>
      </div>
      <TrustMarquee />
    </section>
  );
}
