const { chromium } = require('playwright');

(async () => {
    let browser = await chromium.launch({ headless: true });
    let context = await browser.newContext();
    let page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000); // 4 secs to load UI

    const results = await page.evaluate(() => {
        try {
            const db = window.__db;
            if (!db) return "No db found";

            const tableInfoRaw = db.exec("PRAGMA table_info(chart_of_accounts)");
            const tableInfo = tableInfoRaw.length > 0
                ? tableInfoRaw[0].values.map(row => ({ name: row[1] }))
                : [];

            let log = "tableInfo: " + JSON.stringify(tableInfo) + "\n";
            log += "Cols mapping: " + JSON.stringify(tableInfo) + "\n";
            const cols = tableInfo.map(c => c.name);
            log += "Cols: " + JSON.stringify(cols) + "\n";

            if (!cols.includes("detail_type")) {
                try {
                    db.run("ALTER TABLE chart_of_accounts ADD COLUMN detail_type TEXT");
                    log += "Migración 029 aplicada.\n";
                } catch (e) {
                    log += "Error executing ALTER: " + e.message + "\n";
                }
            } else {
                log += "Already has detail_type.\n";
            }

            const colsAfter = window.__db.exec("PRAGMA table_info(chart_of_accounts)")[0].values.map(r => r[1]);
            log += "Cols after: " + JSON.stringify(colsAfter) + "\n";

            return log;

        } catch (e) { return 'Error: ' + e; }
    });
    console.log(results);
    await browser.close();
})();
