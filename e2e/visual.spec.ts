import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('login page visual snapshot', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
    });
  });

  test('register page visual snapshot', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
    });
  });

  test('login page responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
    });
  });

  test('register page responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');
    await expect(page).toHaveScreenshot('register-page-mobile.png', {
      fullPage: true,
    });
  });
});
