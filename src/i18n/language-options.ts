/** Public language choices; publishing remains an explicit release decision. */
export const languageOptions = [
  { value: 'en', label: 'English', available: true },
  { value: 'ru', label: 'Русский', available: true },
  { value: 'zh-Hant', label: '繁體中文', available: true },
] as const;

export type LanguageCode = (typeof languageOptions)[number]['value'];
