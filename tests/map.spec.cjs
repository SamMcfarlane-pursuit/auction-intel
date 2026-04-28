const { test, expect } = require('@playwright/test');
const url = 'http://127.0.0.1:5174/';

test('map interactions smoke', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Dismiss welcome overlay if present
  const welcomeCTA = page.locator('text=Access Command Center').first();
  if (await welcomeCTA.count() > 0) {
    await welcomeCTA.click();
    await page.waitForTimeout(600);
  }

  // Open the Map view in the sidebar so USMap is mounted
  const mapNav = page.locator('text=Market Map').first();
  if (await mapNav.count() > 0) {
    await mapNav.click();
    await page.waitForTimeout(1200);
    // screenshot for debugging
    await page.screenshot({ path: 'tests/playwright-debug.png', fullPage: true });
  }
  // wait for USMap root to appear (map container)
  await page.waitForSelector('.usmap-root, .usmap-canvas', { timeout: 20000 });

  // Try opening a property from feed (if present)
  const propertyBtn = await page.$('button[data-test="open-property"]');
  if (propertyBtn) {
    await propertyBtn.click();
    await page.waitForTimeout(500);
    const geo = await page.$('button:has-text("Geospatial")');
    if (geo) {
      await geo.click();
      await page.waitForTimeout(1200);
    }
  }

  // Click a marker if present
  const marker = await page.$('.aim-marker');
  if (marker) {
    await marker.click();
    await page.waitForTimeout(600);
    // property modal selector fallback
    const modal = await page.$('.property-modal, [data-test="property-modal"]');
    expect(modal).not.toBeNull();
  }

  // Test zoom buttons
  const zoomIn = await page.$('button[aria-label="Zoom in"]');
  const zoomOut = await page.$('button[aria-label="Zoom out"]');
  const reset = await page.$('button[aria-label="Reset to home view"]');
  if (zoomIn && zoomOut && reset) {
    await zoomIn.click();
    await page.waitForTimeout(500);
    await zoomOut.click();
    await page.waitForTimeout(500);
    await reset.click();
    await page.waitForTimeout(500);
  }

  // Emulate mobile viewport and reload
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });
  const kbd = await page.$('.usmap-kbd-hint');
  // keyboard hint should be hidden on mobile
  if (kbd) {
    const visible = await kbd.isVisible().catch(() => false);
    expect(visible).toBe(false);
  }

});
