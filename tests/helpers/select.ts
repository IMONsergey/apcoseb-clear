import type { Locator } from '@playwright/test';

/** Choose through the visible control, while keeping test values independent of locale. */
export async function chooseSelectOption(scope: Locator, value: string) {
  await scope.getByRole('combobox').click();
  await scope.locator(`[role="option"][data-value=${JSON.stringify(value)}]`).click();
}
