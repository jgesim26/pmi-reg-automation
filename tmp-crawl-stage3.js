const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const storage = './playwright/.auth/user.json';
  const output = { url: null, title: null, htmlPreview: null, anchors: [] };
  if (!fs.existsSync(storage)) {
    console.error('Missing storage state:', storage);
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storage });
  const page = await context.newPage();
  await page.goto('https://stage.app.deepci.com', { waitUntil: 'networkidle', timeout: 60000 });
  output.url = page.url();
  output.title = await page.title();
  output.htmlPreview = (await page.content()).slice(0, 2000);
  const anchors = await page.$$eval('a[href]', els => els.map(a => ({ href: a.getAttribute('href'), text: a.textContent ? a.textContent.trim() : '' })));
  const uniq = [...new Map(anchors.map(a => [a.href, a])).values()];
  output.anchors = uniq.filter(function(a) { if (!a.href) { return false; } return a.href.startsWith('/'); });
  fs.writeFileSync('tmp-crawl-stage3-output.json', JSON.stringify(output, null, 2), 'utf8');
  await browser.close();
})();
