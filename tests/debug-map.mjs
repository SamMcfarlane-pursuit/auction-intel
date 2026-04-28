import { firefox } from 'playwright';
import fs from 'fs';
(async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: String(err) }));
  page.on('response', res => logs.push({ type: 'response', url: res.url(), status: res.status() }));
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
    // Dismiss welcome CTA
    const welcome = page.locator('text=Access Command Center').first();
    if (await welcome.count() > 0) { await welcome.click(); await page.waitForTimeout(800); }
    // Open Market Map
    const mapNav = page.locator('text=Market Map').first();
    if (await mapNav.count() > 0) { await mapNav.click(); await page.waitForTimeout(1500); }
    // Wait for map container
    const found = await page.waitForSelector('.usmap-root, .usmap-canvas', { timeout: 60000 }).catch(e => null);
    if (found) {
      await page.screenshot({ path: 'tests/debug-map-success.png', fullPage: true });
      logs.push({ type: 'info', text: 'Map container found' });
    } else {
      await page.screenshot({ path: 'tests/debug-map-failure.png', fullPage: true });
      logs.push({ type: 'info', text: 'Map container NOT found' });
    }
  } catch (e) {
    logs.push({ type: 'error', text: String(e) });
    await page.screenshot({ path: 'tests/debug-map-exception.png', fullPage: true }).catch(()=>{});
  }
  await browser.close();
  fs.writeFileSync('tests/debug-map-console.log', JSON.stringify(logs, null, 2));
  console.log('Done. Logs written to tests/debug-map-console.log');
})();
