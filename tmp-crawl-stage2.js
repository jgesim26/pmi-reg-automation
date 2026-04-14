const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const storage = './playwright/.auth/user.json';
  if (!fs.existsSync(storage)) {
    console.error('Missing storage state:', storage);
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storage });
  const page = await context.newPage();
  await page.goto('https://stage.app.deepci.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const anchors = await page.$$eval('a[href]', els => els.map(a => ({ href: a.getAttribute('href'), text: a.textContent ? a.textContent.trim() : '' })));
  const uniq = [...new Map(anchors.map(a => [a.href, a])).values()];
  const filtered = uniq.filter(function(a) { if (!a.href) { return false; } return a.href.startsWith('/'); });
  fs.writeFileSync('tmp-crawl-stage2-output.json', JSON.stringify(filtered, null, 2), 'utf8');
  await browser.close();
})();
