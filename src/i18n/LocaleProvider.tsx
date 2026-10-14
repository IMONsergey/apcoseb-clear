import { useMemo, type ReactNode } from 'react';
import { LocaleContext } from './context';
import { translate } from './messages';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      locale: 'en' as const,
      t: (key: string, values?: Record<string, string | number>) => translate('en', key, values),
    }),
    [],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}
