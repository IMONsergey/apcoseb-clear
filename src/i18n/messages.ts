import { typograph } from './typography';

export type Locale = 'en';

export function translate(
  _locale: string,
  key: string,
  values: Record<string, string | number> = {},
) {
  const message = key.replace(/\{(\w+)\}/g, (token, name: string) => String(values[name] ?? token));
  return typograph(message);
}
