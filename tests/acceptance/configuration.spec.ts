import { expect, test } from '@playwright/test';
import { readPublicSettings } from '../../src/config/public-settings';

test('default sign-in opens the client site while unverified API docs stay disabled', () => {
  expect(readPublicSettings({})).toEqual({
    productUrl: 'https://apcosys.net',
    supportEmail: 'info@apcosys.net',
    signInUrl: 'https://apcosys.net/',
    apiDocumentationUrl: null,
  });
});

test('verified deployment settings use the supplied origin and contacts', () => {
  expect(
    readPublicSettings({
      VITE_APCO_PRODUCT_URL: ' https://product.example.com/ ',
      VITE_APCO_SUPPORT_EMAIL: 'support+web@example.com',
      VITE_APCO_SIGN_IN_URL: 'https://product.example.com/login',
      VITE_APCO_API_DOCS_URL: 'https://docs.example.com/api',
    }),
  ).toEqual({
    productUrl: 'https://product.example.com',
    supportEmail: 'support+web@example.com',
    signInUrl: 'https://product.example.com/login',
    apiDocumentationUrl: 'https://docs.example.com/api',
  });
});

for (const [setting, value] of [
  ['VITE_APCO_PRODUCT_URL', 'https://example.com/product'],
  ['VITE_APCO_PRODUCT_URL', 'https://user:password@example.com'],
  ['VITE_APCO_PRODUCT_URL', 'javascript:alert(1)'],
  ['VITE_APCO_PRODUCT_URL', 'http://product.example.com'],
  ['VITE_APCO_PRODUCT_URL', 'http://192.168.1.10:8080'],
  ['VITE_APCO_PRODUCT_URL', 'http://127.0.0.2:8080'],
  ['VITE_APCO_SUPPORT_EMAIL', 'support@example.com?bcc=other@example.com'],
  ['VITE_APCO_SUPPORT_EMAIL', 'support@example.com\nBcc:other@example.com'],
  ['VITE_APCO_SIGN_IN_URL', 'https://other.example.com/login'],
  ['VITE_APCO_SIGN_IN_URL', 'https://user:password@apcosys.net/login'],
  ['VITE_APCO_SIGN_IN_URL', 'http://apcosys.net/login'],
  ['VITE_APCO_API_DOCS_URL', 'http://docs.example.com'],
  ['VITE_APCO_API_DOCS_URL', 'https://user:password@docs.example.com'],
] as const) {
  test(`reject malformed public setting ${setting}: ${value.replaceAll('\n', ' ')}`, () => {
    expect(() => readPublicSettings({ [setting]: value })).toThrow(setting);
  });
}

test('loopback HTTP remains possible for a local product during development', () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    const url = `http://${hostname}:5173`;
    expect(
      readPublicSettings({
        VITE_APCO_PRODUCT_URL: url,
        VITE_APCO_SIGN_IN_URL: url + '/sign-in',
      }),
    ).toMatchObject({
      productUrl: url,
      signInUrl: url + '/sign-in',
    });
  }
});

test('Vercel declares non-disruptive security response headers', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const vercel = JSON.parse(await readFile(resolve('vercel.json'), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const rules = vercel.headers.find((entry) => entry.source === '/(.*)')?.headers ?? [];
  const headers = Object.fromEntries(rules.map(({ key, value }) => [key.toLowerCase(), value]));
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
});
