import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

test('every internal contents link reaches a unique section below the fixed header', async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const route of siteRoutes.filter(
    (route) => route.path !== '/' && !route.path.startsWith('/legal/'),
  )) {
    await page.goto('.' + route.path);
    const links = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');
    await expect(links.first()).toBeVisible();
    expect(await links.count(), route.path).toBeGreaterThan(1);
    for (const link of await links.all()) {
      const href = (await link.getAttribute('href'))!;
      const target = page.locator(href);
      await expect(target).toHaveCount(1);
      await link.click();
      await expect(target).toBeInViewport();
      await expect(link).toHaveAttribute('aria-current', 'location');
      const bounds = await target.boundingBox();
      const header = await page.locator('.site-header').boundingBox();
      expect(bounds!.y, `${route.path}${href}`).toBeGreaterThanOrEqual(
        header!.y + header!.height - 1,
      );
    }
  }
});

test('contact topic selection prepares the form and query presets are validated', async ({
  page,
}) => {
  await page.goto('./contact');
  await page.getByRole('button', { name: /API & integration/ }).click();
  await expect(page.getByRole('combobox', { name: 'Topic', exact: true })).toHaveText('API access');
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
  await expect(page.locator('#contact-form')).toBeInViewport();
  await page.goto('./contact?topic=Billing%20%26%20invoices');
  await expect(page.getByRole('combobox', { name: 'Topic', exact: true })).toHaveText(
    'Billing & invoices',
  );
  await page.goto('./contact?topic=unknown');
  // Invalid URL presets cannot overwrite a topic saved in the user's draft.
  await expect(page.getByRole('combobox', { name: 'Topic', exact: true })).toHaveText(
    'Billing & invoices',
  );
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('apcosys-contact-draft-v1:')) sessionStorage.removeItem(key);
  });
  await page.goto('./contact?topic=unknown');
  await expect(page.getByRole('combobox', { name: 'Topic', exact: true })).toHaveText(
    'Select a topic',
  );
});

test('network exclusion link prepares an actionable email without claiming submission', async ({
  page,
}) => {
  await page.goto('./responsible-scanning');
  const href = await page
    .getByRole('link', { name: 'Prepare a network exclusion request' })
    .getAttribute('href');
  const email = new URL(href!);
  expect(email.protocol).toBe('mailto:');
  expect(email.searchParams.get('subject')).toBe('Apcosys network exclusion request');
  const body = email.searchParams.get('body')?.replace(/\s+/gu, ' ');
  for (const field of [
    'Networks / IP ranges:',
    'My role in managing these networks:',
    'Contact details:',
    'Relevant dates and context:',
  ])
    expect(body).toContain(field);
  await expect(
    page.getByText('Send your IP range and contact details. Our team will review the request.', {
      exact: true,
    }),
  ).toBeVisible();
});
