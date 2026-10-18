import { useMemo, type ReactNode } from 'react';
import { LocaleContext } from './context';
import { translate, type Locale } from './messages';

export function LocaleProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const value = useMemo(
    () => ({
      locale,
      t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    }),
    [locale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}
