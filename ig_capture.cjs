const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2];
  if (!url || !url.includes('instagram.com')) {
    console.error('ERROR: Valid Instagram URL required');
    process.exit(2);
  }

  const username = url.match(/instagram\.com\/([^/?]+)/)?.[1] || 'unknown';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(__dirname, 'out', `ig_${username}_${timestamp}.png`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1024 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Cookie同意・ログインモーダル対応
    const dismissSelectors = [
      'button:has-text("Allow all cookies")',
      'button:has-text("Accept")',
      'button:has-text("Not Now")',
      'button:has-text("Close")',
      '[aria-label*="Close"]'
    ];
    for (const sel of dismissSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click({ timeout: 1000 });
          await page.waitForTimeout(500);
        }
      } catch {}
    }

    // 「続きを読む」展開
    const moreSelectors = [
      'button:has-text("more")',
      'button:has-text("See more")',
      'button:has-text("続きを読む")',
      '[role="button"]:has-text("more")'
    ];
    for (const sel of moreSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click({ timeout: 1000 });
          await page.waitForTimeout(500);
          break;
        }
      } catch {}
    }

    // レイジーロード対応
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`SAVED ${outPath}`);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    if (browser) await browser.close();
    process.exit(2);
  }
})();
