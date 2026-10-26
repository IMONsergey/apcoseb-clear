import Typograf from 'typograf';

type TypographyLocale = 'en' | 'ru' | 'zh-Hant';

const engines: Partial<Record<'en' | 'ru', Typograf>> = {};
function typographyEngine(locale: 'en' | 'ru'): Typograf {
  const cached = engines[locale];
  if (cached) return cached;
  if (locale === 'en') {
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

    engines.en = engine;
    return engine;
  }
  // Technical values, dates, IDs and links stay outside the Russian prose rules.
  const engine = new Typograf({ locale: 'ru' });
  engine.disableRule('*');
  engine.enableRule([
    'common/space/delRepeatSpace',
    'common/space/delBeforePunctuation',
    'common/space/delBeforeDot',
    'common/punctuation/quote',
    'common/punctuation/hellip',
    'common/nbsp/afterShortWord',
    'common/nbsp/afterShortWordByList',
    'ru/dash/main',
    'ru/nbsp/abbr',
    'ru/nbsp/afterNumberSign',
    'ru/nbsp/initials',
    'ru/nbsp/dayMonth',
    'ru/nbsp/mln',
    'ru/nbsp/year',
    'ru/nbsp/rubleKopek',
  ]);

  engines.ru = engine;
  return engine;
}

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
  if (locale === 'zh-Hant' || (locale === 'ru' && !/[А-ЯЁа-яё]/.test(text))) return text;
  const key = `${locale}\u0000${text}`;
  let result = cache.get(key);
  if (result === undefined) {
    result = typographyEngine(locale).execute(text);
    cache.set(key, result);
    cache.set(`${locale}\u0000${result}`, result);
  }
  return result;
}

export function typograph(text: string): string {
  return formatTypography(activeMessages[text] ?? text, activeLocale);
}

export function noBreakNumber(value: string): string {
  return value.replace(/(?<=\d) (?=\d)/g, '\u00a0');
}
