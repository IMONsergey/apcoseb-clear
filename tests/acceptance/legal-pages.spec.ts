import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { legalRoutes } from '../../src/content/legal-routes';
import { siteRoutes } from '../../src/content/routes';

test('the subprocessor list reference provides an actionable existing contact', async ({
  page,
}) => {
  await page.goto('./legal/data-processing-agreement');
  const paragraph = page
    .locator('.legal-copy p')
    .filter({ hasText: 'For the current list of Subprocessors' });
  await expect(
    paragraph.getByRole('link', { name: 'info@apcosys.net', exact: true }),
  ).toHaveAttribute('href', 'mailto:info@apcosys.net');
});

for (const route of legalRoutes) {
  test(`${route.title}: complete published text, valid anchors and local references`, async ({
    page,
    baseURL,
  }) => {
    const source = await readFile(`docs/legal-sources/${route.path.split('/').pop()}.md`, 'utf8');
    await page.goto('.' + route.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.title);
    const expected = await page.evaluate(
      (html) => {
        const source = document.createElement('div');
        source.innerHTML = html;
        source.querySelector('h1')!.remove();
        source.querySelector('p')!.remove(); // Preserved edition date is displayed in the page header.
        const toc = [...source.querySelectorAll('h2')].find(
          (h) => h.textContent === 'Table of Contents',
        );
        if (toc) {
          while (toc.nextElementSibling && toc.nextElementSibling.tagName !== 'H2')
            toc.nextElementSibling.remove();
          toc.remove();
        }
        return source.textContent!.replace(/\s+/g, ' ').trim();
      },
      await marked.parse(source),
    );
    const actual = await page.locator('.legal-copy').textContent();
    expect(actual!.replace(/\s+/g, ' ').trim()).toBe(expected);
    await expect(page.locator('.legal-updated time')).toHaveText('August 4, 2025');
    const navigation = page.getByRole('navigation', { name: 'Legal documents' });
    await expect(navigation.getByRole('link')).toHaveCount(6);
    await expect(navigation.locator('[aria-current="page"]')).toHaveText(route.title);
    const contents = page.getByRole('navigation', { name: 'On this page' });
    for (const link of await contents.getByRole('link').all()) {
      const id = (await link.getAttribute('href'))!;
      await expect(page.locator(`[id="${id.slice(1)}"]`)).toHaveCount(1);
    }
    const links = await page
      .locator('.legal-copy a[href*="/legal/"]')
      .evaluateAll((nodes) => nodes.map((a) => (a as HTMLAnchorElement).pathname));
    for (const path of links) {
      expect(path.startsWith(new URL(baseURL!).pathname + 'legal/'), path).toBe(true);
    }
    const last = contents.getByRole('link').last();
    await last.click();
    const hash = (await last.getAttribute('href'))!;
    await expect(page.locator(`[id="${hash.slice(1)}"]`)).toBeInViewport();
    await page.reload();
    await expect(page.locator(`[id="${hash.slice(1)}"]`)).toBeInViewport();
    const box = await page.locator(`[id="${hash.slice(1)}"]`).boundingBox();
    const header = await page.locator('.site-header').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(header!.height - 1);
  });
}

for (const width of [320, 768, 1440]) {
  test(`legal reading layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of legalRoutes) {
      await page.goto('.' + route.path);
      await expect(page.locator('.legal-copy')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        reading: document.querySelector('.legal-reading')!.getBoundingClientRect().width,
      }));
      expect(geometry.overflow, route.path).toBeLessThanOrEqual(1);
      expect(geometry.reading).toBeLessThanOrEqual(760);
      if (width === 320) {
        await page.locator('.legal-mobile-contents summary').click();
        const link = page.locator('.legal-mobile-contents nav a').last();
        await expect(link).toBeVisible();
        const hash = (await link.getAttribute('href'))!;
        await link.click();
        await expect(page.locator(`[id="${hash.slice(1)}"]`)).toBeInViewport();
      }
    }
  });
}

for (const theme of ['light', 'dark']) {
  test(`legal documents retain accessible hierarchy and contrast in ${theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript((theme) => localStorage.setItem('apcosys-theme-mode', theme), theme);
    for (const route of legalRoutes) {
      await page.goto('.' + route.path);
      await expect(page.locator('.legal-copy')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const result = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations, route.path).toEqual([]);
    }
  });
}

test('footer legal links, cookie dialog and document navigation stay in this site', async ({
  page,
  baseURL,
}) => {
  await page.goto('./');
  // Wait for the lazy homepage before scrolling; its arrival moves the shell footer.
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const footer = page.locator('footer');
  await footer.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page).toHaveURL(new URL('legal/privacy-policy', baseURL!).href);
  await page
    .getByRole('navigation', { name: 'Legal documents' })
    .getByRole('link', { name: 'Cookie Policy', exact: true })
    .click();
  await page.locator('.legal-tools').getByRole('button', { name: 'Cookie Preferences' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cookie Preferences' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Cookie Policy', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.legal-copy')).toBeVisible();
  await page.goto('./contact');
  await expect(page.locator('.stage-consent a')).toHaveAttribute(
    'href',
    new URL('legal/privacy-policy', baseURL!).pathname,
  );
  await expect(page.locator('.stage-consent a')).not.toHaveAttribute('target', '_blank');
});

for (const width of [768, 1280, 1920]) {
  test(`footer metadata shares a single line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./legal/data-collection-policy');
    const metadata = page.locator('.footer-meta > p, .footer-meta > a, .footer-meta > button');
    // The footer mounts after the lazy route is ready, independently of font loading.
    await expect(metadata).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    const centers = await metadata.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.y + rect.height / 2;
      }),
    );
    expect(centers).toHaveLength(3);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
  });
}

test('shell preserves the vector logo and uppercase text labels while content uses Apcosys', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const originalLogo = await readFile('public/assets/brand/logo.svg', 'utf8');
  const originalPaths = [...originalLogo.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1]);
  expect(originalPaths).toHaveLength(2);
  for (const route of siteRoutes) {
    await page.goto('.' + route.path);
    await expect(page.locator('main h1')).toBeVisible();
    const text = await page.locator('main').innerText();
    for (const selector of ['.brand .apcosys-logo', '.footer-brand .apcosys-logo']) {
      const logo = page.locator(selector);
      await expect(logo.locator('text')).toHaveCount(0);
      expect(
        await logo
          .locator('path')
          .evaluateAll((paths) => paths.map((path) => path.getAttribute('d'))),
      ).toEqual(originalPaths);
    }
    await expect(
      page.locator('.footer-columns .eyebrow').filter({ hasText: /^APCOSYS$/ }),
    ).toHaveCount(1);
    await expect(page.locator('.footer-meta > p')).toContainText('APCOSYS');
    expect(text, route.path).not.toMatch(/\bAPCOSYS\b/);
    const labels = await page
      .locator('[aria-label], img[alt]')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('aria-label') || el.getAttribute('alt')),
      );
    expect(labels.join(' '), route.path).not.toMatch(/\bAPCOSYS\b/);
    expect(await page.title()).not.toContain('APCOSYS');
  }
});

test('printing preserves the complete document and removes interface controls', async ({
  page,
}) => {
  await page.goto('./legal/terms');
  await expect(page.locator('.legal-copy')).toBeVisible();
  const body = await page.locator('.legal-copy').textContent();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printRequested = 'true';
    };
  });
  await page.getByRole('button', { name: 'Print document' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-requested', 'true');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.header-spacer')).toBeHidden();
  await expect(page.locator('.legal-copy')).toHaveCSS('color', 'rgb(34, 34, 34)');
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.footer')).toBeHidden();
  await expect(page.locator('.legal-tools')).toBeHidden();
  await expect(page.locator('.legal-copy')).toBeVisible();
  expect(await page.locator('.legal-copy').textContent()).toBe(body);
});
