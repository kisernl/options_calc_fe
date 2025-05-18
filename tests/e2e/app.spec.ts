import { test, expect } from '@playwright/test';

test.describe('Options Calculator', () => {
    test('should display the options calculator form', async ({ page }) => {
        await page.goto('/');
        
        // First verify the stock symbol input is visible
        await expect(page.getByPlaceholder(/Enter stock symbol/i)).toBeVisible();
        
        // Enter a stock symbol to load the form
        await page.getByPlaceholder(/Enter stock symbol/i).fill('AAPL');
        
        // Wait for the expiration date label to appear
        await expect(page.locator('label').filter({ hasText: /Expiration Date/i })).toBeVisible();
        
        // Verify the form elements are present
        await expect(page.getByPlaceholder(/Enter stock symbol/i)).toBeVisible();
        await expect(page.locator('label').filter({ hasText: /Expiration Date/i })).toBeVisible();
        await expect(page.locator('label').filter({ hasText: /Strike Price/i })).toBeVisible();
        
        // Verify the option type buttons are present
        await expect(page.getByRole('button', { name: /PUT/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /CALL/i })).toBeVisible();
    });
});
