const { chromium } = require('playwright');
(async () => {
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    let page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000);
    const triggers = await page.evaluate(() => {
        try {
            return JSON.stringify(window.__db.exec("SELECT name, sql FROM sqlite_master WHERE type = 'trigger'")[0]?.values || [], null, 2);
        } catch (e) { return 'db error: ' + e; }
    });
    console.log(triggers);
    await browser.close();
})();
