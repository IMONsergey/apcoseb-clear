import { useRef, type Dispatch } from 'react';
import type { DemoHost } from '../../content/product-demo';
import { demoHosts } from '../../content/product-demo';
import { useLocale } from '../../i18n/context';
import { LocaleText } from '../../i18n/LocaleText';
import { DoubleButton } from '../ui/DoubleButton';
import { Text } from '../ui/Text';
import { ApplicationGlyph } from '../visuals/application/ApplicationGlyph';
import {
  investigationExamples,
  investigationLocations,
  investigationResponse,
  type InvestigationAction,
  type InvestigationDetail,
  type InvestigationState,
  type InvestigationStory,
} from './investigationDemo';

type Props = {
  state: InvestigationState;
  matches: DemoHost[];
  story: InvestigationStory;
  act: Dispatch<InvestigationAction>;
  dispatch: Dispatch<InvestigationAction>;
};

export function InvestigationScene({ state, matches, story, act, dispatch }: Props) {
  const { t } = useLocale();
  const detailTabs = useRef<HTMLDivElement>(null);
  const host = demoHosts.find((candidate) => candidate.ip === state.hostIp)!;
  const service = host.services.find((candidate) => candidate.port === state.port)!;
  const panelId = 'investigation-service-' + story;

  if (state.step === 0)
    return (
      <div className="investigation-query">
        <Text as="p" className="investigation-hint">
          Try a domain, IP address or technology from these examples.
        </Text>
        <form
          className="investigation-query__form"
          onSubmit={(event) => {
            event.preventDefault();
            act({ type: 'query', value: state.draft });
          }}
        >
          <label htmlFor={'investigation-query-' + story}>
            <LocaleText>{t('Example query')}</LocaleText>
          </label>
          <div className="investigation-query__input">
            <ApplicationGlyph name="search" />
            <input
              id={'investigation-query-' + story}
              name="example_query"
              type="search"
              value={state.draft}
              required
              maxLength={160}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => dispatch({ type: 'draft', value: event.target.value })}
            />
            <DoubleButton type="submit" compact disabled={!state.draft.trim()}>
              <LocaleText>{t('Search examples')}</LocaleText>
            </DoubleButton>
          </div>
        </form>
        <div className="investigation-query__examples" aria-label={t('Example queries')}>
          {investigationExamples.map((query) => (
            <button type="button" key={query} onClick={() => act({ type: 'query', value: query })}>
              <code>{query}</code>
              <ApplicationGlyph name="arrow" />
            </button>
          ))}
        </div>
        {story === 'bounty' && (
          <Text as="p" className="investigation-hint">
            Start with a target explicitly permitted by programme rules.
          </Text>
        )}
      </div>
    );

  if (state.step === 1)
    return (
      <div className="investigation-results">
        <div className="investigation-results__bar">
          <div>
            <Text as="span">Example matches</Text>
            <strong>{matches.length}</strong>
            <code>{state.query}</code>
          </div>
          <button
            className="investigation-text-action"
            type="button"
            onClick={() => act({ type: 'step', value: 0 })}
          >
            <LocaleText>{t('Edit query')}</LocaleText>
            <ApplicationGlyph name="arrow" />
          </button>
        </div>
        {matches.length ? (
          <>
            <Text as="p" className="investigation-hint">
              Select a host to inspect its observed services.
            </Text>
            <table className="investigation-results__table">
              <thead>
                <tr>
                  <th scope="col">
                    <LocaleText>{t('Host / network')}</LocaleText>
                  </th>
                  <th scope="col">
                    <LocaleText>{t('Services')}</LocaleText>
                  </th>
                  <th scope="col">
                    <LocaleText>{t('Location')}</LocaleText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.ip} data-selected={match.ip === state.hostIp}>
                    <th scope="row">
                      <button
                        type="button"
                        className="investigation-result"
                        onClick={() => act({ type: 'host', value: match.ip })}
                      >
                        <strong>{match.ip}</strong>
                        <span>{match.hostname}</span>
                        <ApplicationGlyph name="arrow" />
                      </button>
                    </th>
                    <td>
                      <div className="investigation-service-chips">
                        {match.services.map((item) => (
                          <span key={item.port}>
                            {item.port} {item.protocol}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <LocaleText>{t(investigationLocations[match.ip]!)}</LocaleText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="investigation-results__empty" role="status">
            <Text as="h3">No matching example hosts</Text>
            <Text as="p">
              This example searches two synthetic records. Try example.com, nginx or one of the
              listed IP addresses.
            </Text>
            <button
              className="investigation-text-action"
              type="button"
              onClick={() => act({ type: 'query', value: 'example.com' })}
            >
              <LocaleText>{t('Show example hosts')}</LocaleText>
              <ApplicationGlyph name="arrow" />
            </button>
          </div>
        )}
      </div>
    );

  return (
    <div className="investigation-host">
      <div className="investigation-host__heading">
        <div>
          <h3>{host.ip}</h3>
          <code>{host.hostname}</code>
        </div>
        <button
          type="button"
          className="investigation-text-action"
          onClick={() => act({ type: 'refine' })}
        >
          <LocaleText>{t('Search this hostname')}</LocaleText>
          <ApplicationGlyph name="arrow" />
        </button>
      </div>
      <div className="investigation-host__services">
        <div className="investigation-service-catalog">
          <Text as="p">Services</Text>
          {host.services.map((item) => (
            <button
              type="button"
              key={item.port}
              aria-pressed={state.port === item.port}
              onClick={() => dispatch({ type: 'service', value: item.port })}
            >
              <strong>
                {item.port} {item.protocol}
              </strong>
              <span>{item.technology}</span>
            </button>
          ))}
        </div>
        <div className="investigation-service-detail">
          <div className="investigation-service-detail__heading">
            <strong>
              {service.port} {service.protocol}
            </strong>
            <span>TCP</span>
            <span>{service.technology}</span>
          </div>
          <div
            className="investigation-detail-tabs"
            ref={detailTabs}
            role="tablist"
            aria-label={t('Service evidence')}
          >
            {(['response', 'tls'] as const).map((detail, index) => (
              <button
                type="button"
                role="tab"
                key={detail}
                id={panelId + '-' + detail}
                aria-selected={state.detail === detail}
                aria-controls={panelId}
                tabIndex={state.detail === detail ? 0 : -1}
                disabled={detail === 'tls' && service.protocol !== 'HTTPS'}
                onClick={() => dispatch({ type: 'detail', value: detail })}
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const next =
                    service.protocol !== 'HTTPS' || event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? 1
                        : 1 - index;
                  dispatch({
                    type: 'detail',
                    value: (next ? 'tls' : 'response') as InvestigationDetail,
                  });
                  detailTabs.current
                    ?.querySelectorAll<HTMLButtonElement>('button')
                    .item(next)
                    ?.focus();
                }}
              >
                <LocaleText>{t(detail === 'response' ? 'Response' : 'TLS')}</LocaleText>
              </button>
            ))}
          </div>
          <div
            className="investigation-service-detail__body"
            role="tabpanel"
            tabIndex={0}
            id={panelId}
            aria-labelledby={panelId + '-' + state.detail}
          >
            {state.detail === 'response' ? (
              <>
                <pre>
                  <code>{investigationResponse(host, state.port)}</code>
                </pre>
                <Text as="p">{service.evidence}</Text>
              </>
            ) : (
              <dl className="investigation-tls">
                <div>
                  <dt>
                    <LocaleText>{t('Server name')}</LocaleText>
                  </dt>
                  <dd>{host.hostname}</dd>
                </div>
                <div>
                  <dt>
                    <LocaleText>{t('Protocol')}</LocaleText>
                  </dt>
                  <dd>TLS 1.3</dd>
                </div>
                <div>
                  <dt>
                    <LocaleText>{t('Issuer')}</LocaleText>
                  </dt>
                  <dd>Example Certificate Authority</dd>
                </div>
                <div>
                  <dt>
                    <LocaleText>{t('Valid until')}</LocaleText>
                  </dt>
                  <dd>
                    <time dateTime="2027-01-01">2027-01-01</time>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
      <Text as="p" className="investigation-host__context">
        {story === 'bounty'
          ? 'Confirm the scope and rules again before interacting with the host.'
          : story === 'vulnerability'
            ? 'Detected banners and versions can be incomplete or misleading.'
            : story === 'osint'
              ? 'Technical similarities are not proof of shared ownership.'
              : 'Select a service, then inspect its response or TLS certificate.'}
      </Text>
    </div>
  );
}
