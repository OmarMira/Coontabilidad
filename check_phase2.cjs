const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000);

        const results = await page.evaluate(() => {
            try {
                const tableExists = window.__db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_of_accounts'")[0]?.values || [];
                const count = window.__db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0]?.values[0][0];
                const columns = window.__db.exec("PRAGMA table_info(chart_of_accounts)")[0]?.values || [];

                return {
                    tableExists,
                    count,
                    columns
                };
            } catch (e) { return { error: e.toString() }; }
        });

        console.log("\n--- VERIFICACIÓN INICIAL ---");
        console.log("Tabla existe:", results.tableExists);
        console.log("Conteo de cuentas:", results.count);
        console.log("\nColumnas actuales (PRAGMA table_info):");
        if (results.columns && results.columns.length) {
            results.columns.forEach(col => {
                // col format is usually [cid, name, type, notnull, dflt_value, pk]
                console.log(`- ${col[1]} (${col[2]})`);
            });
        }

        await browser.close();
    } catch (e) {
        console.error("Test execution error:", e);
        if (browser) await browser.close();
    }
})();
