import { Text } from '../ui/Text';
import { useEffect, useRef, useState } from 'react';
import { apiRequestExample, apiResponseExample } from '../../content/api-example';
import { useLocale } from '../../i18n/context';
export function ApiExample({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const [response, setResponse] = useState(false);
  const [copyState, setCopyState] = useState('Copy');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyVersion = useRef(0);
  const code = useRef<HTMLPreElement>(null);
  const snippet = response ? apiResponseExample : apiRequestExample;
  const requestNote =
    'Documented HTTP request. Set APCOSYS_API_KEY in your server environment before running it.';
  const responseNote =
    'Example response. total counts matches; hosts contains this page. uts is the last update in Unix seconds.';
  const resetCopy = () => {
    copyVersion.current++;
    clearTimeout(copyTimer.current);
    setCopyState('Copy');
  };
  useEffect(
    () => () => {
      copyVersion.current++;
      clearTimeout(copyTimer.current);
    },
    [],
  );
  const copy = async () => {
    const version = ++copyVersion.current;
    clearTimeout(copyTimer.current);
    let result = 'Copied';
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      if (version !== copyVersion.current) return;
      const selection = window.getSelection();
      if (code.current && selection) {
        const range = document.createRange();
        range.selectNodeContents(code.current);
        selection.removeAllRanges();
        selection.addRange(range);
        result = 'Selected';
      } else result = 'Copy failed';
    }
    if (version !== copyVersion.current) return;
    setCopyState(result);
    copyTimer.current = setTimeout(() => setCopyState('Copy'), 2200);
  };
  return (
    <div className={'stage-code-window' + (compact ? ' stage-code-window--compact' : '')}>
      <div className="stage-code-header">
        <div className="stage-code-tabs" role="group" aria-label={t('API code example')}>
          <button
            type="button"
            aria-pressed={!response}
            onClick={() => {
              setResponse(false);
              resetCopy();
            }}
          >
            {t('Request')}
          </button>
          <button
            type="button"
            aria-pressed={response}
            onClick={() => {
              setResponse(true);
              resetCopy();
            }}
          >
            {t('Response')}
          </button>
        </div>
        <button type="button" className="stage-code-copy" onClick={copy}>
          {t(copyState)}
        </button>
      </div>
      {!compact && (
        <div className="stage-api-auth">
          <span>{t('AUTHENTICATION')}</span>
          <Text as="p">
            Use the X-API-Key header. Keep your API key on a trusted server, outside browser code.
          </Text>
        </div>
      )}
      <div className="stage-code-body">
        <pre
          key={response ? 'response' : 'request'}
          ref={code}
          tabIndex={0}
          aria-label={t(response ? 'Illustrative API response' : 'API request template')}
        >
          <code>{snippet}</code>
        </pre>
        <div className="stage-code-notes">
          <Text as="p" className="stage-code-note">
            {response ? responseNote : requestNote}
          </Text>
          <Text as="p" className="stage-code-note-reserve" aria-hidden="true">
            {response ? requestNote : responseNote}
          </Text>
        </div>
      </div>
      <span className="sr-only" role="status">
        {copyState === 'Copy'
          ? ''
          : copyState === 'Selected'
            ? t('Clipboard unavailable. Code selected; use your device’s copy command.')
            : t(copyState)}
      </span>
    </div>
  );
}
