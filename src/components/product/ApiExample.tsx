import { Text } from '../ui/Text';
import { useEffect, useRef, useState } from 'react';
import { MorphPanel } from '../ui/MorphPanel';
import { apiRequestExample, apiResponseExample } from '../../content/product-demo';
export function ApiExample({ compact = false }: { compact?: boolean }) {
  const [response, setResponse] = useState(false);
  const [copyState, setCopyState] = useState('Copy');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyVersion = useRef(0);
  const code = useRef<HTMLPreElement>(null);
  const snippet = response ? apiResponseExample : apiRequestExample;
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
        <div className="stage-code-tabs" role="group" aria-label="API code example">
          <button
            type="button"
            aria-pressed={!response}
            onClick={() => {
              setResponse(false);
              resetCopy();
            }}
          >
            Request
          </button>
          <button
            type="button"
            aria-pressed={response}
            onClick={() => {
              setResponse(true);
              resetCopy();
            }}
          >
            Response
          </button>
        </div>
        <button type="button" className="stage-code-copy" onClick={copy}>
          {copyState}
        </button>
      </div>
      {!compact && (
        <div className="stage-api-auth">
          <span>AUTHENTICATION</span>
          <Text as="p">
            Obtain your key inside Apcosys. Set the endpoint and authentication header from the
            confirmed API reference.
          </Text>
        </div>
      )}
      <MorphPanel>
        <pre
          ref={code}
          data-morph-enter
          tabIndex={0}
          aria-label={response ? 'Illustrative API response' : 'API request template'}
        >
          <code>{snippet}</code>
        </pre>
        <Text as="p" className="stage-code-note">
          {response
            ? 'Synthetic host data, not the production response schema.'
            : 'Request template. Endpoint and authentication contract require product confirmation.'}
        </Text>
      </MorphPanel>
      <span className="sr-only" role="status">
        {copyState === 'Copy'
          ? ''
          : copyState === 'Selected'
            ? 'Clipboard unavailable. Code selected; use your device’s copy command.'
            : copyState}
      </span>
    </div>
  );
}
