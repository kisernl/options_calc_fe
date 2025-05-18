import { Page } from '@playwright/test';

export async function fillOptionsForm(
  page: Page,
  options: {
    symbol: string;
    expirationDate?: string;
    strikePrice?: string;
  }
) {
  // Fill in the symbol
  await page.getByLabel(/Symbol/i).fill(options.symbol);
  
  // Fill in expiration date if provided
  if (options.expirationDate) {
    await page.getByLabel(/Expiration Date/i).fill(options.expirationDate);
  }
  
  // Fill in strike price if provided
  if (options.strikePrice) {
    await page.getByLabel(/Strike Price/i).fill(options.strikePrice);
  }
  
  // Click the calculate button
  await page.getByRole('button', { name: /Calculate/i }).click();
}

export async function waitForLoadingToComplete(page: Page) {
  // Wait for any loading indicators to disappear
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Small delay to ensure all UI updates are complete
}
