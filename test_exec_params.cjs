const { chromium } = require('playwright');

(async () => {
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    let page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000);

    // Check what getChartOfAccountByCode does directly in the browser
    const testCode = await page.evaluate(() => {
        try {
            const firstAcc = window.__db.exec("SELECT account_code FROM chart_of_accounts LIMIT 1")[0].values[0][0];
            const test1 = window.__db.exec("SELECT * FROM chart_of_accounts WHERE account_code = ?", [firstAcc]);
            const test2 = window.__db.exec("SELECT * FROM chart_of_accounts WHERE account_code = '" + firstAcc + "'");
            return {
                firstAcc,
                test1: test1.length > 0 ? "WORKS" : "FAILS",
                test1Values: test1[0]?.values,
                test2: test2.length > 0 ? "WORKS" : "FAILS",
            };
        } catch (e) { return 'Error: ' + e; }
    });
    console.log(testCode);
    console.log("Check complete");

    await browser.close();
})();
