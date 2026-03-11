const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        let logs = [];
        page.on('console', msg => {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        });

        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000);

        console.log("\n--- EXECUTING CONSOLE CHECKS ---");

        const tables = await page.evaluate(() => {
            try {
                const res = window.__db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%account%'");
                if (res.length === 0) return 'None';
                return JSON.stringify(res[0].values);
            } catch (e) {
                return "DB Error: " + e;
            }
        });
        console.log(`1. Tablas conteniendo 'account' -> ${tables}`);

        const cols = await page.evaluate(() => {
            try {
                const res = window.__db.exec("PRAGMA table_info(chart_of_accounts)");
                if (res.length === 0) return 'None';
                return JSON.stringify(res[0].values);
            } catch (e) {
                return "DB Error: " + e;
            }
        });
        console.log(`2. Columnas en chart_of_accounts -> ${cols}`);

        // Let's also check where the problem comes from, maybe grep the loaded scripts:
        console.log("\n--- ÚLTIMOS LOGS ---");
        const keywords = ['update', 'save', 'error', 'accounts'];
        const filteredLogs = logs.filter(l => keywords.some(k => l.toLowerCase().includes(k.toLowerCase())));
        const last10 = filteredLogs.slice(-10);
        last10.forEach(l => console.log(l));
        console.log("----------------------");

        await browser.close();
    } catch (e) {
        console.error("Fatal Test execution error:", e);
        if (browser) await browser.close();
    }
})();
