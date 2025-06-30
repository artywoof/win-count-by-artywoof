import { test, expect } from '@playwright/test';

// Helper to simulate closing the Tauri app window but keeping it in tray
async function closeAppWindowButKeepTray(page: any) {
  // This is a mock. In real Tauri E2E, you might use a Tauri automation API or IPC.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('tauri:window-close'));
  });
  // Wait for overlay to update if needed
  await page.waitForTimeout(500);
}

// Helper to simulate reopening the app (for persistence test)
async function reopenApp(page: any) {
  // This is a mock. In real Tauri E2E, you might relaunch the app or reload state.
  await page.reload();
  await page.waitForTimeout(500);
}

test.describe('Win Count Integration', () => {
  test('Increasing win count updates Overlay immediately', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="win-increase"]');
    const overlayCount = page.locator('[data-testid="overlay-win-count"]');
    await expect(overlayCount).toHaveText('1');
  });

  test('Decreasing win count updates Overlay immediately', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="win-decrease"]');
    const overlayCount = page.locator('[data-testid="overlay-win-count"]');
    await expect(overlayCount).toHaveText('0');
  });

  test('Toggling crown icon (show/hide) syncs with Overlay', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="toggle-crown"]');
    const crownIcon = page.locator('[data-testid="overlay-crown"]');
    await expect(crownIcon).toBeVisible();
    await page.click('[data-testid="toggle-crown"]');
    await expect(crownIcon).toBeHidden();
  });

  test('Toggling goal (show/hide) syncs with Overlay', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="toggle-goal"]');
    const goalElement = page.locator('[data-testid="overlay-goal"]');
    await expect(goalElement).toBeVisible();
    await page.click('[data-testid="toggle-goal"]');
    await expect(goalElement).toBeHidden();
  });

  test('Win up/down sound effects play correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="win-increase"]');
    const audio = page.locator('audio[data-testid="win-sound"]');
    await expect(audio).toBeVisible();
    // Optionally, check if audio is playing
    await expect(await audio.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
    await page.click('[data-testid="win-decrease"]');
    await expect(audio).toBeVisible();
    await expect(await audio.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  });

  test('Win count and preset are saved after app is closed and reopened', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await page.click('[data-testid="win-increase"]');
    // Simulate setting a preset if available
    // await page.click('[data-testid="preset-1"]');
    await closeAppWindowButKeepTray(page);
    await reopenApp(page);
    const overlayCount = page.locator('[data-testid="overlay-win-count"]');
    await expect(overlayCount).toHaveText('1');
    // Optionally, check preset state
    // const preset = page.locator('[data-testid="overlay-preset"]');
    // await expect(preset).toHaveText('Preset 1');
  });

  test('Overlay stays visible even when the app window is closed (still in tray)', async ({ page }) => {
    await page.goto('http://localhost:5173/overlay');
    await closeAppWindowButKeepTray(page);
    const overlayRoot = page.locator('[data-testid="overlay-root"]');
    await expect(overlayRoot).toBeVisible();
  });
});
