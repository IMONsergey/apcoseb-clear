import Typograf from 'typograf';

type TypographyLocale = 'en' | 'ru' | 'zh-Hant';

const engine = new Typograf({ locale: 'en-US' });
engine.disableRule('*');
engine.enableRule([
  'common/space/*',
  'common/punctuation/*',
  'common/nbsp/afterShortWord',
  'common/nbsp/afterShortWordByList',
  'common/nbsp/beforeShortLastWord',
  'en-US/dash/main',
]);
engine.disableRule([
  'common/space/trimLeft',
  'common/space/trimRight',
  'common/space/delLeadingBlanks',
  'common/space/delTrailingBlanks',
  'common/space/insertFinalNewline',
]);

const cache = new Map<string, string>();
let activeLocale: TypographyLocale = 'en';
let activeMessages: Readonly<Record<string, string>> = {};

export function setTypographyLocale(
  locale: TypographyLocale,
  messages: Readonly<Record<string, string>> = {},
) {
  activeLocale = locale;
  activeMessages = messages;
}

export function formatTypography(text: string, locale: TypographyLocale): string {
  if (locale !== 'en') return text;
  let result = cache.get(text);
  if (result === undefined) {
    result = engine.execute(text);
    cache.set(text, result);
    cache.set(result, result);
  }
  return result;
}

export function typograph(text: string): string {
  return formatTypography(activeMessages[text] ?? text, activeLocale);
}

export function noBreakNumber(value: string): string {
  return value.replace(/(?<=\d) (?=\d)/g, '\u00a0');
}
