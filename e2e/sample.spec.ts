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

  test('should navigate to register page when clicking register link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).click();

    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });
});

test.describe('Register Page', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByText('Enclavr')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('textbox').first()).toBeVisible();
    await expect(page.getByRole('textbox').nth(1)).toBeVisible();
    await expect(page.getByRole('textbox').nth(2)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Login' }).click();

    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Homepage', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Rooms Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/rooms');

    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('DM Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dm');

    await expect(page).toHaveURL(/.*\/login/);
  });
});
