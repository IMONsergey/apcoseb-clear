import { createContext, useContext } from 'react';
import { translate, type Locale } from './messages';

export type LocaleState = {
  locale: Locale;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export const LocaleContext = createContext<LocaleState>({
  locale: 'en',
  t: (key, values) => translate('en', key, values),
});

export const useLocale = () => useContext(LocaleContext);
