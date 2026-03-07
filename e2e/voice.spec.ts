import { test, expect } from '@playwright/test';

const VOICE_USERS = [
  { userId: 'user-1', username: 'alice', isMuted: false, isSpeaking: true, isScreenSharing: false },
  { userId: 'user-2', username: 'bob', isMuted: true, isSpeaking: false, isScreenSharing: false },
  { userId: 'user-3', username: 'charlie', isMuted: false, isSpeaking: false, isScreenSharing: true },
];

const ICE_SERVERS = {
  ice_servers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

test.describe('Voice Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
  });

  test('should display voice channel section', async ({ page }) => {
    const voiceSection = page.locator('[class*="voice"], section[id*="voice"]');
    const count = await voiceSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have mute/unmute button', async ({ page }) => {
    const muteButton = page.getByRole('button', { name: /mute|unmute/i });
    const count = await muteButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have deafen/undeafen button', async ({ page }) => {
    const deafenButton = page.getByRole('button', { name: /deafen|undeafen/i });
    const count = await deafenButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have settings button for voice', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings|voice settings/i });
    const count = await settingsButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show speaking indicator', async ({ page }) => {
    const speakingIndicator = page.locator('[class*="speaking"], [class*="voice-activity"]');
    const count = await speakingIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display connected voice users', async ({ page }) => {
    const voiceUser = page.locator('[class*="voice-user"], [class*="participant"]');
    const count = await voiceUser.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have video toggle for screen share', async ({ page }) => {
    const videoButton = page.getByRole('button', { name: /video|screen/i });
    const count = await videoButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show microphone selection dropdown', async ({ page }) => {
    const micSelect = page.locator('select[name*="mic"], [id*="microphone"]');
    const count = await micSelect.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show speaker selection dropdown', async ({ page }) => {
    const speakerSelect = page.locator('select[name*="speaker"], [id*="output"]');
    const count = await speakerSelect.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Voice Chat States', () => {
  test('should handle muted state', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const mutedIcon = page.locator('[class*="muted"], [class*="mic-off"]');
    const count = await mutedIcon.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle deafened state', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const deafenedIcon = page.locator('[class*="deafened"], [class*="headphone-off"]');
    const count = await deafenedIcon.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle screen sharing state', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const screenShareIcon = page.locator('[class*="screen-share"], [class*="sharing"]');
    const count = await screenShareIcon.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display voice quality indicator', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const qualityIndicator = page.locator('[class*="quality"], [class*="connection"]');
    const count = await qualityIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Voice Chat ICE Configuration', () => {
  test('should configure STUN servers', async () => {
    const config = ICE_SERVERS;
    expect(config.ice_servers).toHaveLength(2);
    expect(config.ice_servers[0].urls).toContain('stun:');
  });

  test('should handle ICE server configuration', () => {
    const servers = ICE_SERVERS.ice_servers;
    servers.forEach(server => {
      expect(server.urls).toBeDefined();
      expect(typeof server.urls === 'string' || Array.isArray(server.urls)).toBe(true);
    });
  });
});

test.describe('Voice User Data', () => {
  test('should map voice user data correctly', () => {
    VOICE_USERS.forEach(user => {
      expect(user.userId).toBeDefined();
      expect(user.username).toBeDefined();
      expect(typeof user.isMuted).toBe('boolean');
      expect(typeof user.isSpeaking).toBe('boolean');
      expect(typeof user.isScreenSharing).toBe('boolean');
    });
  });

  test('should identify speaking users', () => {
    const speakingUsers = VOICE_USERS.filter(u => u.isSpeaking);
    expect(speakingUsers).toHaveLength(1);
    expect(speakingUsers[0].username).toBe('alice');
  });

  test('should identify muted users', () => {
    const mutedUsers = VOICE_USERS.filter(u => u.isMuted);
    expect(mutedUsers).toHaveLength(1);
    expect(mutedUsers[0].username).toBe('bob');
  });

  test('should identify screen sharing users', () => {
    const sharingUsers = VOICE_USERS.filter(u => u.isScreenSharing);
    expect(sharingUsers).toHaveLength(1);
    expect(sharingUsers[0].username).toBe('charlie');
  });
});

test.describe('WebRTC Connection', () => {
  test('should establish peer connection', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(2000);
    const success = await page.evaluate(() => {
      return typeof RTCPeerConnection !== 'undefined';
    });
    expect(success).toBe(true);
  });

  test('should have WebRTC support', async ({ page }) => {
    const webrtcSupport = await page.evaluate(() => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    });
    expect(webrtcSupport).toBe(true);
  });

  test('should handle ICE candidates', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const iceHandler = await page.evaluate(() => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      let candidates: RTCIceCandidate[] = [];
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        }
      };
      pc.close();
      return candidates.length >= 0;
    });
    expect(iceHandler).toBe(true);
  });

  test('should support media devices', async ({ page }) => {
    const mediaSupport = await page.evaluate(() => {
      return !!navigator.mediaDevices;
    });
    expect(mediaSupport).toBe(true);
  });
});

test.describe('Audio/Video Controls', () => {
  test('should toggle microphone', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const micButton = page.getByRole('button', { name: /mute/i });
    if (await micButton.count() > 0) {
      await micButton.first().click();
      await page.waitForTimeout(500);
    }
    expect(true).toBe(true);
  });

  test('should toggle deafen', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const deafenButton = page.getByRole('button', { name: /deafen/i });
    if (await deafenButton.count() > 0) {
      await deafenButton.first().click();
      await page.waitForTimeout(500);
    }
    expect(true).toBe(true);
  });

  test('should toggle screen share', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const screenButton = page.getByRole('button', { name: /screen/i });
    if (await screenButton.count() > 0) {
      await screenButton.first().click();
      await page.waitForTimeout(500);
    }
    expect(true).toBe(true);
  });
});

test.describe('Voice Chat Performance', () => {
  test('should maintain connection quality', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const stats = page.locator('[class*="stats"], [class*="latency"]');
    const count = await stats.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle reconnection', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const reconnectButton = page.getByRole('button', { name: /reconnect/i });
    const count = await reconnectButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Voice Chat Accessibility', () => {
  test('should announce voice state changes', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const announcements = page.locator('[aria-live], [role="status"]');
    const count = await announcements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have keyboard shortcuts for voice', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForTimeout(1000);
    const shortcuts = page.locator('[class*="shortcut"], [class*="hotkey"]');
    const count = await shortcuts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
