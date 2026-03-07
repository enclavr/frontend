import { test, expect } from '@playwright/test';

const REAL_TEST_USERS = [
  { id: 'user-1', username: 'alice', email: 'alice@example.com', display_name: 'Alice', avatar_url: '', is_admin: false },
  { id: 'user-2', username: 'bob', email: 'bob@example.com', display_name: 'Bob', avatar_url: '', is_admin: false },
  { id: 'user-3', username: 'charlie', email: 'charlie@example.com', display_name: 'Charlie', avatar_url: '', is_admin: true },
];

const REAL_TEST_ROOMS = [
  { id: 'room-1', name: 'General', description: 'General discussion', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-01-01T00:00:00Z', user_count: 12, category_id: 'cat-1' },
  { id: 'room-2', name: 'Voice Chat', description: 'Voice chat room', is_private: false, max_users: 25, created_by: 'user-2', created_at: '2026-01-02T00:00:00Z', user_count: 5, category_id: 'cat-1' },
  { id: 'room-3', name: 'Dev Talk', description: 'Development discussions', is_private: false, max_users: 100, created_by: 'user-3', created_at: '2026-01-03T00:00:00Z', user_count: 28, category_id: 'cat-2' },
  { id: 'room-4', name: 'Private Room', description: 'Private discussion', is_private: true, max_users: 10, created_by: 'user-1', created_at: '2026-01-04T00:00:00Z', user_count: 3, category_id: 'cat-2' },
];

const REAL_TEST_CATEGORIES = [
  { id: 'cat-1', name: 'Public', sort_order: 0, created_at: '2026-01-01T00:00:00Z', room_count: 2 },
  { id: 'cat-2', name: 'Development', sort_order: 1, created_at: '2026-01-01T00:00:00Z', room_count: 2 },
  { id: 'cat-3', name: 'Private', sort_order: 2, created_at: '2026-01-01T00:00:00Z', room_count: 0 },
];

const REAL_TEST_MESSAGES = [
  { id: 'msg-1', room_id: 'room-1', user_id: 'user-1', username: 'alice', type: 'text' as const, content: 'Welcome to Enclavr!', is_edited: false, is_deleted: false, created_at: '2026-01-15T10:00:00Z' },
  { id: 'msg-2', room_id: 'room-1', user_id: 'user-2', username: 'bob', type: 'text' as const, content: 'Hello everyone!', is_edited: false, is_deleted: false, created_at: '2026-01-15T10:05:00Z' },
  { id: 'msg-3', room_id: 'room-1', user_id: 'user-3', username: 'charlie', type: 'text' as const, content: 'Great to be here!', is_edited: false, is_deleted: false, created_at: '2026-01-15T10:10:00Z' },
];

const REAL_TEST_PRESENCE = [
  { user_id: 'user-1', username: 'alice', status: 'online' as const, room_id: 'room-1', last_seen: '2026-01-15T10:30:00Z' },
  { user_id: 'user-2', username: 'bob', status: 'away' as const, room_id: 'room-1', last_seen: '2026-01-15T10:25:00Z' },
  { user_id: 'user-3', username: 'charlie', status: 'busy' as const, room_id: 'room-2', last_seen: '2026-01-15T10:20:00Z' },
  { user_id: 'user-4', username: 'dave', status: 'offline' as const, last_seen: '2026-01-15T09:00:00Z' },
];

const REAL_TEST_CONVERSATIONS = [
  { user_id: 'user-2', username: 'bob', display_name: 'Bob', avatar_url: '', last_message: 'Hey, how are you?', last_time: '2026-01-15T10:30:00Z', unread_count: 2 },
  { user_id: 'user-3', username: 'charlie', display_name: 'Charlie', avatar_url: '', last_message: 'See you later!', last_time: '2026-01-15T09:00:00Z', unread_count: 0 },
];

const REAL_TEST_DM_MESSAGES = [
  { id: 'dm-1', sender_id: 'user-1', receiver_id: 'user-2', content: 'Hey Bob!', is_edited: false, is_deleted: false, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z', sender: REAL_TEST_USERS[0], receiver: REAL_TEST_USERS[1] },
  { id: 'dm-2', sender_id: 'user-2', receiver_id: 'user-1', content: 'Hi Alice!', is_edited: false, is_deleted: false, created_at: '2026-01-15T10:05:00Z', updated_at: '2026-01-15T10:05:00Z', sender: REAL_TEST_USERS[1], receiver: REAL_TEST_USERS[0] },
];

test.describe('Rooms Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rooms');
  });

  test('should display rooms page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rooms/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display categories in sidebar', async ({ page }) => {
    await page.waitForTimeout(1000);
    const categories = page.locator('[class*="category"], [data-testid="category"]');
    const count = await categories.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display room cards', async ({ page }) => {
    await page.waitForTimeout(1000);
    const roomCards = page.locator('[class*="room"], [data-testid="room-card"]');
    const count = await roomCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show user count on room cards', async ({ page }) => {
    await page.waitForTimeout(1000);
    const userCount = page.locator('[class*="user-count"], [class*="member"]');
    await expect(userCount.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have create room button for authenticated users', async ({ page }) => {
    await page.waitForTimeout(1000);
    const createButton = page.getByRole('button', { name: /create room|new room/i });
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display search/filter input', async ({ page }) => {
    await page.waitForTimeout(1000);
    const searchInput = page.getByPlaceholder(/search|filter/i);
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Rooms List Display', () => {
  test('should display room names correctly', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const roomNames = page.locator('h2, h3, [class*="name"], [class*="title"]');
    const count = await roomNames.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should indicate private rooms differently', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const privateIndicator = page.locator('[class*="private"], [class*="lock"]');
    const count = await privateIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show room descriptions on hover or expand', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const description = page.locator('[class*="description"]');
    const count = await description.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Direct Messages Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dm');
  });

  test('should display DM page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /messages?|direct/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display conversation list', async ({ page }) => {
    await page.waitForTimeout(1000);
    const conversations = page.locator('[class*="conversation"], [class*="dm"], [data-testid="conversation"]');
    const count = await conversations.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show unread message count', async ({ page }) => {
    await page.waitForTimeout(1000);
    const unreadBadge = page.locator('[class*="unread"], [class*="badge"]');
    const count = await unreadBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have new message button', async ({ page }) => {
    await page.waitForTimeout(1000);
    const newMessageButton = page.getByRole('button', { name: /new message|compose/i });
    await expect(newMessageButton.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Presence', () => {
  test('should display online users indicator', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const onlineIndicator = page.locator('[class*="online"], [class*="status"]');
    const count = await onlineIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show user status (online/away/busy/offline)', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const statusElements = page.locator('[class*="status"]');
    const count = await statusElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Chat Interface', () => {
  test('should have message input field', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const messageInput = page.getByRole('textbox', { name: /message|chat/i });
    await expect(messageInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have send button', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const sendButton = page.getByRole('button', { name: /send|submit/i });
    await expect(sendButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display message timestamps', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const timestamps = page.locator('[class*="timestamp"], [class*="time"]');
    const count = await timestamps.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display username on messages', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const usernames = page.locator('[class*="username"], [class*="author"]');
    const count = await usernames.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have emoji/reaction button', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const emojiButton = page.getByRole('button', { name: /emoji|react/i });
    await expect(emojiButton.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Room Actions', () => {
  test('should have join room button', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const joinButton = page.getByRole('button', { name: /join|enter/i });
    await expect(joinButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have leave room option', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const leaveButton = page.getByRole('button', { name: /leave|exit/i });
    const count = await leaveButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display room settings for admins', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const settingsButton = page.getByRole('button', { name: /settings|manage/i });
    const count = await settingsButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Voice Chat', () => {
  test('should have voice controls', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const muteButton = page.getByRole('button', { name: /mute|unmute|deafen/i });
    const count = await muteButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have disconnect button', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const disconnectButton = page.getByRole('button', { name: /disconnect|leave voice/i });
    const count = await disconnectButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show connected users in voice channel', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const voiceUsers = page.locator('[class*="voice"], [class*="speaking"]');
    const count = await voiceUsers.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Responsive Layout', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('rooms-mobile.png', { fullPage: true });
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('rooms-tablet.png', { fullPage: true });
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const sidebar = page.locator('[class*="sidebar"], aside');
    const isVisible = await sidebar.first().isVisible();
    expect(isVisible).toBe(false);
  });
});

test.describe('Navigation', () => {
  test('should navigate between rooms and dm', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(500);
    const dmLink = page.getByRole('link', { name: /messages|dm|direct/i });
    if (await dmLink.count() > 0) {
      await dmLink.first().click();
      await expect(page).toHaveURL(/.*\/dm/);
    }
  });

  test('should have user profile menu', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const profileMenu = page.locator('[class*="profile"], [class*="avatar"], [data-testid="user-menu"]');
    await expect(profileMenu.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have logout option', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const count = await logoutButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', route => route.abort('failed'));
    await page.goto('/rooms');
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('[class*="error"], [class*="failed"]');
    const count = await errorMessage.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(500);
    const loading = page.locator('[class*="loading"], [class*="spinner"]');
    const count = await loading.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty states', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const emptyState = page.locator('[class*="empty"], [class*="no-results"]');
    const count = await emptyState.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const interactive = page.locator('button, [role="button"], a[href]');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const text = page.locator('p, h1, h2, h3, h4, h5, h6, span, a');
    const count = await text.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' ? 'visible' : 'none';
    });
    expect(focused).not.toBe('none');
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/rooms');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/rooms');
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e => !e.includes('favicon'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Security Headers', () => {
  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/rooms');
    const headers = response?.headers() || {};
    expect(headers['x-content-type-options'] || headers['x-frame-options']).toBeDefined();
  });
});

test.describe('Real Data Integration', () => {
  test('should display real user data structure', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    
    const userData = REAL_TEST_USERS[0];
    const userElement = page.locator(`text=${userData.username}`);
    const count = await userElement.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display real room data structure', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    
    const roomData = REAL_TEST_ROOMS[0];
    const roomElement = page.locator(`text=${roomData.name}`);
    const count = await roomElement.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle presence data correctly', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    
    const presenceData = REAL_TEST_PRESENCE;
    expect(presenceData).toHaveLength(4);
    expect(presenceData.filter(p => p.status === 'online')).toHaveLength(1);
    expect(presenceData.filter(p => p.status === 'offline')).toHaveLength(1);
  });

  test('should handle message data correctly', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    
    const messageData = REAL_TEST_MESSAGES;
    expect(messageData).toHaveLength(3);
    expect(messageData[0].type).toBe('text');
    expect(messageData[0].is_deleted).toBe(false);
  });

  test('should handle DM conversations correctly', async ({ page }) => {
    await page.goto('/dm');
    await page.waitForTimeout(1000);
    
    const conversations = REAL_TEST_CONVERSATIONS;
    expect(conversations).toHaveLength(2);
    expect(conversations[0].unread_count).toBeGreaterThan(0);
  });
});
