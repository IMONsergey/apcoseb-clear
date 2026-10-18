import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Text } from '../../src/components/ui/Text';
import { plans, businessPlan } from '../../src/content/plans';
import { languageOptions } from '../../src/i18n/language-options';
import {
  calculatePrice,
  formatApiRate,
  formatCredits,
  planComparison,
} from '../../src/lib/pricing';
import { markRouteReady, waitForRouteReady } from '../../src/app/routeReadiness';

test('language options use canonical tags and native labels', () => {
  expect(languageOptions.map((language) => language.value)).toEqual(['en', 'ru', 'zh-Hant']);
  expect(languageOptions.map((language) => language.label)).toEqual([
    'English',
    'Русский',
    '繁體中文',
  ]);
  for (const language of languageOptions) {
    expect(Intl.getCanonicalLocales(language.value)).toEqual([language.value]);
  }
});

test('ordinary authored text is formatted without changing its semantic element or link', () => {
  const result = renderToStaticMarkup(
    createElement(
      Text,
      { as: 'p', className: 'copy' },
      'Bring  a query to the team',
      createElement('a', { href: '/search?q=a--b' }, 'Read  the guide'),
    ),
  );
  expect(result).toMatch(/^<p class="copy">/);
  expect(result).not.toContain('Bring  a');
  expect(result).not.toContain('Read  the');
  expect(result).toContain('href="/search?q=a--b"');
  expect(result).not.toContain('<span');
});

test('verbatim text, code and form values survive typography unchanged', () => {
  const text = 'a  --  b';
  const result = renderToStaticMarkup(
    createElement(
      Text,
      { as: 'p' },
      createElement('code', null, text),
      createElement('span', { 'data-typography': 'verbatim' }, text),
      createElement('input', { defaultValue: text }),
    ),
  );
  expect(result).toContain(`<code>${text}</code>`);
  expect(result).toContain(`<span data-typography="verbatim">${text}</span>`);
  expect(result).toContain(`value="${text}"`);
  expect(
    renderToStaticMarkup(createElement(Text, { as: 'p', 'data-typography': 'verbatim' }, text)),
  ).toContain(`>${text}</p>`);
});

test('pricing comparison and API limits use the same product allowances', () => {
  expect(new Set(plans.map((plan) => plan.id)).size).toBe(plans.length);
  expect(plans.find((plan) => plan.id === 'business')).toBe(businessPlan);
  for (const plan of plans) {
    expect(plan.api).toBe(plan.apiRequestsPerSecond !== null);
    expect(planComparison.find((row) => row.label === 'Credits')!.value(plan)).toBe(
      formatCredits(plan.credits),
    );
    expect(planComparison.find((row) => row.label === 'API rate limit')!.value(plan)).toBe(
      formatApiRate(plan),
    );
    expect(Number.isInteger(plan.credits) && plan.credits > 0).toBe(true);
    expect(Number.isInteger(plan.users) && plan.users > 0).toBe(true);
  }
});

test('subscription prices use monthly list rates and a 20% annual discount', () => {
  const expected = [
    { id: 'free', monthly: 0, annualMonthly: 0, annualTotal: 0 },
    { id: 'plus', monthly: 50, annualMonthly: 40, annualTotal: 480 },
    { id: 'expert', monthly: 300, annualMonthly: 240, annualTotal: 2880 },
    { id: 'business', monthly: 900, annualMonthly: 720, annualTotal: 8640 },
  ];
  for (const { id, monthly, annualMonthly, annualTotal } of expected) {
    const plan = plans.find((item) => item.id === id);
    expect(plan).toBeDefined();
    expect(calculatePrice(plan!.price, 'monthly')).toEqual({ monthly, total: monthly });
    expect(calculatePrice(plan!.price, 'annually')).toEqual({
      monthly: annualMonthly,
      total: annualTotal,
    });
  }
});

test('route readiness waits for the destination commit and clears after unmount', async () => {
  const controller = new AbortController();
  const unmountOld = markRouteReady('/old');
  const next = waitForRouteReady('/next', controller.signal);
  unmountOld();
  const unmountNext = markRouteReady('/next');
  expect(await next).toBe(true);
  expect(await waitForRouteReady('/next', controller.signal)).toBe(true);
  unmountNext();
  const stale = waitForRouteReady('/next', controller.signal);
  controller.abort();
  expect(await stale).toBe(false);
});

test('an interrupted navigation cannot be completed by a later route commit', async () => {
  const controller = new AbortController();
  const interrupted = waitForRouteReady('/interrupted', controller.signal);
  controller.abort();
  const unmount = markRouteReady('/interrupted');
  expect(await interrupted).toBe(false);
  expect(await waitForRouteReady('/interrupted', controller.signal)).toBe(false);
  unmount();
});
