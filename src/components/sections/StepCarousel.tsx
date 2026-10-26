import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { useCarousel } from '../../hooks/useCarousel';
import { researchSteps } from '../../content/research';
import { Icon } from '../ui/Icon';
import { Visual } from '../visuals/Visual';
import { StepIllustration } from '../visuals/StepIllustration';
import { DoubleButton } from '../ui/DoubleButton';
import { siteHref } from '../../app/paths';
export function StepCarousel() {
  const { locale, t } = useLocale();
  const { track, position, positions, move, goTo } = useCarousel();
  return (
    <section id="how-it-works" className="steps section-space" aria-labelledby="steps-title">
      <div className="container section-heading-row">
        <h2 id="steps-title">
          {locale === 'en' ? (
            <>
              <LocaleText>{t('One query,')}</LocaleText>
              <br />
              <LocaleText>{t('step by step.')}</LocaleText>
            </>
          ) : (
            <LocaleText>{t('One query, step by step.')}</LocaleText>
          )}
        </h2>
        <div className="steps-intro">
          <Icon name="focus" width="25" height="25" />
          <p>
            <LocaleText>
              {t(
                'Start with a single query. See which hosts match, open one, review its technical context and decide where to look next.',
              )}
            </LocaleText>
          </p>
        </div>
      </div>
      <div className="container carousel-controls">
        <span className="counter" aria-live="polite" aria-atomic="true">
          {position + 1} / {positions}
        </span>
        <div className="carousel-arrows">
          <button
            type="button"
            className="icon-button"
            aria-label={t('Previous research step')}
            aria-controls="research-track"
            disabled={position === 0}
            onClick={() => move(-1)}
          >
            <Icon name="previous" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Next research step')}
            aria-controls="research-track"
            disabled={position >= positions - 1}
            onClick={() => move(1)}
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
      <div className="carousel-bleed">
        <ul
          id="research-track"
          className="step-track"
          ref={track}
          aria-label={t('Five steps of an investigation')}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault();
              goTo(event.key === 'Home' ? 0 : positions - 1);
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              move(event.key === 'ArrowRight' ? 1 : -1);
            }
          }}
        >
          {researchSteps.map((step) => (
            <li className="step-card" key={step.title}>
              <div className="step-copy">
                <h3>
                  <LocaleText>{t(step.title)}</LocaleText>
                </h3>
                <p>
                  <LocaleText>{t(step.description)}</LocaleText>
                </p>
              </div>
              <div className="step-media">
                <Visual kind="dots" direction="bottom-to-top" />
                <StepIllustration scene={step.scene} alt={step.alt} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="container step-evidence-note">
        <p>
          <LocaleText>
            {t('Query, results, host, technical context and the next search.')}
          </LocaleText>
        </p>
        <DoubleButton compact href={siteHref('/platform/search-investigation')}>
          <LocaleText>{t('Explore Search & Investigation')}</LocaleText>
        </DoubleButton>
      </div>
    </section>
  );
}
