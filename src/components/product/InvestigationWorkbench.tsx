import { useEffect, useReducer, useRef } from 'react';
import { Text } from '../ui/Text';
import { productUrl } from '../../config/site';
import { siteHref } from '../../app/paths';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';
import { InvestigationScene } from './InvestigationScene';
import {
  findInvestigationHosts,
  initialInvestigationState,
  investigationReducer,
  investigationStories,
  type InvestigationAction,
  type InvestigationStep,
  type InvestigationStory,
} from './investigationDemo';
import './InvestigationWorkbench.css';

const steps = ['Query', 'Results', 'Host'] as const;

export function InvestigationWorkbench({ story = 'search' }: { story?: InvestigationStory }) {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(investigationReducer, story, (initialStory) =>
    initialInvestigationState(
      initialStory,
      new URLSearchParams(window.location.search).get('demoHost'),
    ),
  );
  const data = investigationStories[story];
  const matches = findInvestigationHosts(state.query);
  const stepsRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const focusViewer = useRef(false);

  function act(action: InvestigationAction) {
    focusViewer.current = true;
    dispatch(action);
  }

  useEffect(() => {
    const nav = stepsRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      const box = active.getBoundingClientRect();
      const frame = nav.getBoundingClientRect();
      if (box.left < frame.left) nav.scrollLeft -= frame.left - box.left;
      else if (box.right > frame.right) nav.scrollLeft += box.right - frame.right;
    }
    if (focusViewer.current) {
      focusViewer.current = false;
      viewerRef.current?.focus({ preventScroll: true });
    }
  }, [state.step, state.query]);

  return (
    <section
      className={'stage-workbench stage-workbench--' + story + ' section-space'}
      id="investigation"
      aria-label={t('{name} interactive illustrated workflow', { name: t(data.tag) })}
    >
      <div className="container">
        <div className="stage-workbench__intro">
          <Text as="h2">{data.heading}</Text>
          <Text as="p">{data.context}</Text>
        </div>
        <div className="stage-workbench__stage">
          <nav
            ref={stepsRef}
            className="stage-workbench__steps"
            role="tablist"
            aria-label={t('Investigation workflow steps')}
          >
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                id={'stage-step-' + story + '-' + index}
                className="stage-workbench__step"
                role="tab"
                aria-selected={state.step === index}
                aria-controls={'stage-panel-' + story}
                disabled={index === 2 && !matches.length}
                tabIndex={state.step === index ? 0 : -1}
                onClick={() => dispatch({ type: 'step', value: index as InvestigationStep })}
                onKeyDown={(event) => {
                  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const count = matches.length ? steps.length : steps.length - 1;
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? count - 1
                        : (index +
                            (event.key === 'ArrowRight' || event.key === 'ArrowDown'
                              ? 1
                              : count - 1)) %
                          count;
                  dispatch({ type: 'step', value: next as InvestigationStep });
                  stepsRef.current
                    ?.querySelectorAll<HTMLButtonElement>('button')
                    .item(next)
                    ?.focus({ preventScroll: true });
                }}
              >
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <strong>
                  <LocaleText>{t(label)}</LocaleText>
                </strong>
              </button>
            ))}
          </nav>
          <div
            ref={viewerRef}
            className="stage-workbench__viewer"
            role="tabpanel"
            tabIndex={0}
            id={'stage-panel-' + story}
            aria-labelledby={'stage-step-' + story + '-' + state.step}
          >
            <InvestigationScene
              state={state}
              matches={matches}
              story={story}
              act={act}
              dispatch={dispatch}
            />
          </div>
          <Text as="p" className="stage-workbench__notice">
            Example records. Reserved addresses and synthetic responses.
          </Text>
        </div>
        <div className="stage-workbench__bottom">
          <a href={productUrl + '/search'}>
            <LocaleText>{t('Try Search')}</LocaleText>
          </a>
          <a href={siteHref('/platform/data-methodology')}>
            <LocaleText>{t('Data & Methodology')}</LocaleText>
          </a>
        </div>
      </div>
    </section>
  );
}
