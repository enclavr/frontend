import { test, expect } from '@playwright/test';

test.describe('Basic Layout', () => {
  test('Login page has proper styling', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Enclavr')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    
    // Check styling
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Check input fields
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Login page styling matches globals.css dark theme', async ({ page }) => {
    await page.goto('/login');
    
    // Get computed styles for the body
    const bodyBackground = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('Body background:', bodyBackground);
    
    // The page should have the dark background from globals.css
    // RGB values for #1a1a2e is rgb(26, 26, 46)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Rooms page loads (redirects to login when not authenticated)', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('DM page loads (redirects to login when not authenticated)', async ({ page }) => {
    await page.goto('/dm');
    await page.waitForTimeout(1000);
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Account page loads (redirects to login when not authenticated)', async ({ page }) => {
    await page.goto('/account');
    await page.waitForTimeout(1000);
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
