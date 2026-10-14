import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Keep WCAG filtering intact; enabling an extra rule must not replace runOnly. */
export function wcagAxe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } });
}
