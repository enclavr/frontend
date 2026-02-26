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

    await expect(page.getByRole('link', { name: 'Register' }).first()).toBeVisible();
  });

  test('should navigate to register page when clicking register link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).first().click();

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

    await expect(page.locator('p').getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    await page.goto('/register');
    await page.locator('p').getByRole('link', { name: 'Login' }).click();

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

test.describe('Login Form Validation', () => {
  test('should have required attribute on username field', async ({ page }) => {
    await page.goto('/login');
    
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('should have required attribute on password field', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
});

test.describe('Register Form Validation', () => {
  test('should have required attributes on all fields', async ({ page }) => {
    await page.goto('/register');
    
    const inputs = page.locator('input');
    await expect(inputs).toHaveCount(3);
    
    for (let i = 0; i < 3; i++) {
      await expect(inputs.nth(i)).toHaveAttribute('required', '');
    }
  });
});

test.describe('Accessibility', () => {
  test('should support keyboard navigation on login page', async ({ page }) => {
    await page.goto('/login');
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox').first()).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox').nth(1)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Login' })).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should display branding on login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Enclavr', level: 1 })).toBeVisible();
  });

  test('should display branding on register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByRole('heading', { name: 'Enclavr', level: 1 })).toBeVisible();
  });
});

test.describe('Login Form Behavior', () => {
  test('should have username input with correct attributes', async ({ page }) => {
    await page.goto('/login');
    
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('should allow typing in username field', async ({ page }) => {
    await page.goto('/login');
    
    const usernameInput = page.locator('input[type="text"]');
    await usernameInput.fill('testuser');
    await expect(usernameInput).toHaveValue('testuser');
  });

  test('should have password input with correct type', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should allow typing in password field', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });
});

test.describe('Register Form Behavior', () => {
  test('should have three separate input fields', async ({ page }) => {
    await page.goto('/register');
    
    const inputs = page.locator('input');
    await expect(inputs).toHaveCount(3);
  });

  test('should allow typing in all fields', async ({ page }) => {
    await page.goto('/register');
    
    const inputs = page.locator('input');
    await inputs.first().fill('testuser');
    await inputs.nth(1).fill('test@example.com');
    await inputs.nth(2).fill('password123');
    
    await expect(inputs.first()).toHaveValue('testuser');
    await expect(inputs.nth(1)).toHaveValue('test@example.com');
    await expect(inputs.nth(2)).toHaveValue('password123');
  });
});

test.describe('UI Components', () => {
  test('should have visible form labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible();
    await expect(inputs.nth(1)).toBeVisible();
  });

  test('should have styled submit button', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.getByRole('button', { name: 'Login' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('should have register link in login page', async ({ page }) => {
    await page.goto('/login');
    
    const registerLink = page.getByRole('link', { name: 'Register' }).first();
    await expect(registerLink).toBeVisible();
  });
});

test.describe('Page Meta', () => {
  test('should have correct page title for login', async ({ page }) => {
    await page.goto('/login');
    
    const title = await page.title();
    expect(title).toContain('Enclavr');
  });

  test('should have correct page title for register', async ({ page }) => {
    await page.goto('/register');
    
    const title = await page.title();
    expect(title).toContain('Enclavr');
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/login');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });
});

test.describe('Error Prevention', () => {
  test('should require username field', async ({ page }) => {
    await page.goto('/login');
    
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toHaveAttribute('required');
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should allow special characters in username', async ({ page }) => {
    await page.goto('/login');
    
    const usernameInput = page.locator('input[type="text"]');
    await usernameInput.fill('test.user@example');
    await expect(usernameInput).toHaveValue('test.user@example');
  });
});
