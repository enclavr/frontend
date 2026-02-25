import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Enclavr')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('textbox').first()).toBeVisible();
    await expect(page.getByRole('textbox').nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should have register link', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });
});

test.describe('Homepage', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/.*\/login/);
  });
});
