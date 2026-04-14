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
  const base = 'https://stage.app.deepci.com';
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('URL', page.url());
  console.log('Title:', await page.title());
  const anchors = await page.$$eval('a[href]', els => els.map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim() })));
  const uniq = [...new Map(anchors.map(a => [a.href, a])).values()];
  const filtered = uniq.filter(a => a.href && a.href.startsWith('/'));
  console.log('Internal anchors found:', filtered.length);
  filtered.slice(0, 100).forEach(a => console.log(a.href, '-', a.text));
  const buttons = await page.$$eval('button', els => els.map(b => ({ text: (b.textContent || '').trim() })));
  console.log('Buttons count', buttons.length);
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
