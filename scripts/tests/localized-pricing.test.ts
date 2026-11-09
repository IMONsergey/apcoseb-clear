import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLocale, translate } from '../../src/i18n/messages.ts';
import { apiLimitLabel, formatCredits, formatPrice } from '../../src/lib/pricing.ts';
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

test('Russian token quantities select grammatical forms by count', async () => {
  await loadLocale('ru');
  const t = (source: string, values?: Record<string, string | number>) =>
    translate('ru', source, values);
  for (const [count, tokens] of [
    [1, 'поисковый токен'],
    [2, 'поисковых токена'],
    [4, 'поисковых токена'],
    [5, 'поисковых токенов'],
    [11, 'поисковых токенов'],
    [21, 'поисковый токен'],
    [25_000, 'поисковых токенов'],
    [1_000_000, 'поисковых токенов'],
  ] as const) {
    assert.equal(t('Search Tokens', { count }), tokens);
  }
  assert.equal(t('Search Tokens'), 'Поисковые токены');
  assert.equal(apiLimitLabel(businessPlan, t), 'См. документацию API');
  assert.equal(t('Missing source with {count}', { count: 5 }), 'Missing source with 5');
});

test('plural variants do not change the English fallback or Chinese counters', async () => {
  assert.equal(apiLimitLabel(plans.find((plan) => plan.id === 'plus')!), 'See API documentation');
  assert.equal(apiLimitLabel(plans.find((plan) => plan.id === 'free')!), '—');
  assert.equal(apiLimitLabel(businessPlan), 'See API documentation');
  await loadLocale('zh-Hant');
  const t = (source: string, values?: Record<string, string | number>) =>
    translate('zh-Hant', source, values);
  assert.equal(apiLimitLabel(businessPlan, t), '查看 API 文件');
  assert.equal(t('Search Tokens', { count: 4 }), '個搜尋權杖');
  assert.equal(t('Search Tokens', { count: 25_000 }), '個搜尋權杖');
});
