import { firefox } from 'playwright';
import fs from 'fs';
(async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });
    const welcome = page.locator('text=Access Command Center').first();
    if (await welcome.count() > 0) { await welcome.click(); await page.waitForTimeout(800); }
    const mapNav = page.locator('text=Market Map').first();
    if (await mapNav.count() > 0) { await mapNav.click(); await page.waitForTimeout(1500); }
    const exists = await page.evaluate(() => !!document.querySelector('.usmap-root'));
    const inner = await page.evaluate(() => {
      const el = document.querySelector('.usmap-root');
      return el ? el.innerHTML.slice(0, 2000) : '';
    });
    fs.writeFileSync('tests/check-dom.json', JSON.stringify({ exists, inner }, null, 2));
    console.log('Wrote tests/check-dom.json');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
