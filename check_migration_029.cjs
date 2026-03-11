const { chromium } = require('playwright');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        let migrationLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('Migración 029')) {
                migrationLogs.push(msg.text());
            }
        });

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000); // Give time for DB to initialize

        const results = await page.evaluate(() => {
            try {
                const count = window.__db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0]?.values[0][0];
                const columnsInfo = window.__db.exec("PRAGMA table_info(chart_of_accounts)")[0]?.values || [];

                return {
                    count,
                    columnsInfo
                };
            } catch (e) { return { error: e.toString() }; }
        });

        console.log("\n--- RESULTADOS POST-MIGRACIÓN ---");

        if (migrationLogs.length > 0) {
            console.log("Logs de migración interceptados:");
            migrationLogs.forEach(l => console.log(l));
        } else {
            console.log("No se interceptaron logs de la migración (puede haber sido muy rápido o fallado).");
        }

        console.log("\nPRAGMA table_info(chart_of_accounts):");
        if (results.columnsInfo && results.columnsInfo.length) {
            // Get last 5 columns to show detail_type
            const lastCols = results.columnsInfo.slice(-5);
            lastCols.forEach(col => {
                const notNull = col[3] ? 'NOT NULL' : 'NULL';
                console.log(`- ${col[1]} (${col[2]}) [${notNull}]`);
            });
        }

        console.log("\nConteo de cuentas post-migración: " + results.count);

        await browser.close();
    } catch (e) {
        console.error("Test execution error:", e);
        if (browser) await browser.close();
    }
})();
