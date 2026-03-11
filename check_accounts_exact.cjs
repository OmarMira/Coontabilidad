const { chromium } = require('playwright');
(async () => {
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    let page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000);
    const tables = await page.evaluate(() => {
        try {
            return JSON.stringify(window.__db.exec("SELECT type, name, sql FROM sqlite_master WHERE sql LIKE '% accounts %' OR sql LIKE '% accounts,%' OR sql LIKE '% accounts(%'")[0]?.values || [], null, 2);
        } catch (e) {
            return "Error: " + e.message;
        }
    });
    console.log(tables);
    await browser.close();
})();
