import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLocale, translate } from '../../src/i18n/messages.ts';
import { formatApiRate, formatCredits, formatPrice } from '../../src/lib/pricing.ts';
import { businessPlan, plans } from '../../src/content/plans.ts';

const spaces = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ');

test('commercial figures use the same locale conventions for cards and packages', () => {
  assert.equal(spaces(formatCredits(25_000, false, 'ru')), '25 000');
  assert.equal(spaces(formatCredits(1_000_000, false, 'ru')), '1 000 000');
  assert.equal(spaces(formatPrice(50, 'ru')), '50 $');
  assert.equal(spaces(formatPrice(900, 'ru')), '900 $');
  assert.equal(formatCredits(25_000, false, 'en'), '25,000');
  assert.equal(formatPrice(50, 'en'), '$50');
  assert.equal(formatCredits(25_000, false, 'zh-Hant'), '25,000');
  assert.equal(formatPrice(50, 'zh-Hant'), '$50');
});

test('Russian rates and token quantities select grammatical forms by count', async () => {
  await loadLocale('ru');
  const t = (source: string, values?: Record<string, string | number>) =>
    translate('ru', source, values);
  for (const [count, rate, tokens] of [
    [1, '1 запрос/с', 'поисковый токен'],
    [2, '2 запроса/с', 'поисковых токена'],
    [4, '4 запроса/с', 'поисковых токена'],
    [5, '5 запросов/с', 'поисковых токенов'],
    [11, '11 запросов/с', 'поисковых токенов'],
    [21, '21 запрос/с', 'поисковый токен'],
    [25_000, '25000 запросов/с', 'поисковых токенов'],
    [1_000_000, '1000000 запросов/с', 'поисковых токенов'],
  ] as const) {
    assert.equal(spaces(t('{count} requests/s', { count })), rate);
    assert.equal(t('Search Tokens', { count }), tokens);
  }
  assert.equal(t('Search Tokens'), 'Поисковые токены');
  assert.equal(spaces(formatApiRate(businessPlan, t)), '5 запросов/с');
  assert.equal(t('Missing source with {count}', { count: 5 }), 'Missing source with 5');
});

test('plural variants do not change the English fallback or Chinese counters', async () => {
  assert.equal(formatApiRate(plans.find((plan) => plan.id === 'plus')!), '1 request/s');
  assert.equal(formatApiRate(businessPlan), '5 requests/s');
  await loadLocale('zh-Hant');
  const t = (source: string, values?: Record<string, string | number>) =>
    translate('zh-Hant', source, values);
  assert.equal(formatApiRate(businessPlan, t), '每秒 5 次請求');
  assert.equal(t('Search Tokens', { count: 4 }), '個搜尋權杖');
  assert.equal(t('Search Tokens', { count: 25_000 }), '個搜尋權杖');
});
