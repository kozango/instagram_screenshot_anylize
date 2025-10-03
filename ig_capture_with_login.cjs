require('dotenv').config();
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

  const IG_USERNAME = process.env.IG_USERNAME;
  const IG_PASSWORD = process.env.IG_PASSWORD;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1024 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // ログイン処理（環境変数が設定されている場合）
    if (IG_USERNAME && IG_PASSWORD) {
      console.log('Logging in to Instagram...');
      
      await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Cookie同意ボタン
      try {
        const cookieBtn = page.locator('button:has-text("Allow all cookies"), button:has-text("Accept")').first();
        if (await cookieBtn.isVisible({ timeout: 2000 })) {
          await cookieBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch {}

      // ログインフォーム入力
      await page.fill('input[name="username"]', IG_USERNAME);
      await page.waitForTimeout(500);
      await page.fill('input[name="password"]', IG_PASSWORD);
      await page.waitForTimeout(500);
      
      // ログインボタンクリック
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      // "情報を保存しますか？" → "Not Now"
      try {
        const saveInfoBtn = page.locator('button:has-text("Not Now"), button:has-text("保存しない")').first();
        if (await saveInfoBtn.isVisible({ timeout: 2000 })) {
          await saveInfoBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch {}

      // "通知をオンにしますか？" → "Not Now"
      try {
        const notifBtn = page.locator('button:has-text("Not Now"), button:has-text("後で")').first();
        if (await notifBtn.isVisible({ timeout: 2000 })) {
          await notifBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch {}

      console.log('Login completed.');
    }

    // 目的のプロフィールページへ移動
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // ログインモーダル対応（念のため）
    const dismissSelectors = [
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
