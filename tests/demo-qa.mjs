import { firefox } from 'playwright';
import fs from 'fs';
(async () => {
  const log = [];
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', m => log.push({ type: 'console', text: m.text() }));
  page.on('pageerror', e => log.push({ type: 'error', text: String(e) }));
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
    log.push({ step: 'loaded' });
    // Try Demo Account button
    const demoBtn = page.locator('text=Try Demo Account').first();
    if (await demoBtn.count() > 0) {
      await demoBtn.click();
      log.push({ step: 'clicked demo' });
      await page.waitForTimeout(1200);
    } else {
      log.push({ step: 'demo button not found' });
    }

    // Wait for Market Map nav to appear
    const mapNav = page.locator('text=Market Map').first();
    await mapNav.waitFor({ timeout: 20000 });
    await mapNav.click();
    log.push({ step: 'opened market map' });
    await page.waitForTimeout(1500);

    // wait for map container
    const found = await page.waitForSelector('.usmap-root, .usmap-canvas', { timeout: 60000 }).catch(() => null);
    if (found) {
      log.push({ step: 'map found' });
      await page.screenshot({ path: 'tests/demo-qa-map.png', fullPage: true });
      // Try clicking a marker
      const marker = await page.$('.aim-marker, .aim-cluster, [class*=aim-marker]');
      if (marker) {
        try {
          await marker.click({ timeout: 2000 });
          log.push({ step: 'clicked marker' });
          await page.waitForTimeout(800);
          const modal = await page.$('.property-modal, [data-test="property-modal"]');
          log.push({ modal: !!modal });
        } catch (e) { log.push({ error: 'marker click failed', e: String(e) }); }
      } else {
        log.push({ step: 'no marker found' });
      }

      // Zoom buttons
      const zoomIn = await page.$('button[aria-label="Zoom in"]');
      const zoomOut = await page.$('button[aria-label="Zoom out"]');
      const reset = await page.$('button[aria-label="Reset to home view"]');
      if (zoomIn && zoomOut && reset) {
        await zoomIn.click(); await page.waitForTimeout(400);
        await zoomOut.click(); await page.waitForTimeout(400);
        await reset.click(); await page.waitForTimeout(400);
        log.push({ step: 'zoom buttons ok' });
      } else {
        log.push({ step: 'zoom controls missing' });
      }

      // Mobile emulation: viewport change
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload({ waitUntil: 'networkidle' });
      const kbd = await page.$('.usmap-kbd-hint');
      if (kbd) {
        const visible = await kbd.isVisible().catch(() => false);
        log.push({ kbd_visible_on_mobile: visible });
      } else {
        log.push({ kbd_present: false });
      }

    } else {
      log.push({ step: 'map not found' });
      await page.screenshot({ path: 'tests/demo-qa-no-map.png', fullPage: true });
    }
  } catch (e) {
    log.push({ error: String(e) });
    await page.screenshot({ path: 'tests/demo-qa-exception.png', fullPage: true }).catch(()=>{});
  }
  await browser.close();
  fs.writeFileSync('tests/demo-qa-log.json', JSON.stringify(log, null, 2));
  console.log('QA complete. Wrote tests/demo-qa-log.json and screenshots.');
})();
