import Typograf from 'typograf';

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

export function typograph(text: string): string {
  let result = cache.get(text);
  if (result === undefined) {
    result = engine.execute(text);
    cache.set(text, result);
    cache.set(result, result);
  }
  return result;
}

export function noBreakNumber(value: string): string {
  return value.replace(/(?<=\d) (?=\d)/g, '\u00a0');
}
