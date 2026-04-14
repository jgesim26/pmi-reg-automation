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
  await page.goto('https://stage.app.deepci.com', { waitUntil: 'networkidle', timeout: 60000 });
  const data = {
    url: page.url(),
    title: await page.title(),
    bodySnippet: (await page.content()).slice(0, 2000),
    anchorCount: await page.$$eval('a[href]', els => els.length),
    links: await page.$$eval('[role="link"]', els => els.map(el => ({ text: el.textContent ? el.textContent.trim() : '', role: el.getAttribute('role') }))),
    buttons: await page.$$eval('button', els => els.map(el => ({ text: el.textContent ? el.textContent.trim() : '' }))),
  };
  fs.writeFileSync('tmp-crawl-stage4-output.json', JSON.stringify(data, null, 2), 'utf8');
  await browser.close();
})();
