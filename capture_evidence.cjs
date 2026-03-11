const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        let logs = [];
        page.on('console', msg => {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        });

        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000);

        // Simulate click to "LIBRO MAYOR / CONTABILIDAD" -> "Plan de Cuentas"
        console.log("Navigating to Plan de Cuentas...");
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'accounts' }));
        });
        await page.waitForTimeout(3000);

        // Take screenshot of list
        const listPath = 'C:\\Users\\PC Omar\\.gemini\\antigravity\\brain\\5c73b835-1f4d-4119-b78d-9fa991322ebf\\artifacts\\plan_de_cuentas_list.png';
        await page.screenshot({ path: listPath });
        console.log(`[Screenshot 1] Captura completa de Plan de Cuentas: ${listPath}`);

        console.log("\n--- EXECUTING CONSOLE CHECKS ---");
        const persisted = await page.evaluate(async () => { return await navigator.storage.persisted(); });
        console.log(`1. await navigator.storage.persisted() -> ${persisted}`);

        const countAccounts = await page.evaluate(() => {
            try {
                return window.__db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0].values[0][0];
            } catch (e) {
                return "DB Error: " + e;
            }
        });
        console.log(`2. window.__db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0].values[0][0] -> ${countAccounts}`);

        const queryAccounts = await page.evaluate(() => {
            try {
                return JSON.stringify(window.__db.exec("SELECT * FROM accounts WHERE id = 1 LIMIT 1"));
            } catch (e) {
                return "DB Error: " + e;
            }
        });
        console.log(`3. window.__db.exec("SELECT * FROM accounts WHERE id = X LIMIT 1") [X=1] -> ${queryAccounts}`);

        const queryCoA = await page.evaluate(() => {
            try {
                return JSON.stringify(window.__db.exec("SELECT * FROM chart_of_accounts WHERE id = 1 LIMIT 1"));
            } catch (e) {
                return "DB Error: " + e;
            }
        });
        console.log(`4. console.log(window.__db.exec("SELECT * FROM chart_of_accounts WHERE id = X LIMIT 1")) [X=1] -> ${queryCoA}`);

        // Try clicking on edit account "pencil" icon if present
        console.log("\nAttempting to edit an account...");
        // Look for buttons with lucide-pencil or Edit text inside a table
        const editButtons = page.locator('button:has(.lucide-pencil), button:has-text("Editar")');
        const numEditBtns = await editButtons.count();
        if (numEditBtns > 0) {
            console.log(`Encontrados ${numEditBtns} botones de editar. Clickeando el primero...`);
            await editButtons.first().click({ force: true });
            await page.waitForTimeout(1000);

            // Edit description and save
            await page.fill('input[name="description"], input[placeholder*="Descrip"]', 'Edit test', { timeout: 2000 }).catch(e => console.log("No description input found"));
            await page.locator('button', { hasText: 'Guardar' }).first().click().catch(e => console.log("No save button found"));
            await page.waitForTimeout(1500);

            const errPath = 'C:\\Users\\PC Omar\\.gemini\\antigravity\\brain\\5c73b835-1f4d-4119-b78d-9fa991322ebf\\artifacts\\plan_de_cuentas_error.png';
            await page.screenshot({ path: errPath });
            console.log(`[Screenshot 2] Captura tras intentar guardar/editar la cuenta: ${errPath}`);
        } else {
            console.log("No edit buttons found in UI, falling back straight to logs.");
        }

        // Backup Panel
        console.log("\nNavigating to Respaldos y Restauración...");
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'recovery' }));
        });
        await page.waitForTimeout(2000);

        const backupPath = 'C:\\Users\\PC Omar\\.gemini\\antigravity\\brain\\5c73b835-1f4d-4119-b78d-9fa991322ebf\\artifacts\\backup_panel.png';
        await page.screenshot({ path: backupPath });
        console.log(`[Screenshot 3] Captura de Respaldos y Restauración: ${backupPath}`);

        const toggleVisible = await page.locator(':has-text("Activar Almacenamiento Persistente")').count();
        console.log(`¿Botón "Activar Almacenamiento Persistente" visible?: ${toggleVisible > 0 ? 'Sí' : 'No'}`);

        // Download Backup
        console.log("\nClicking 'Backup Manual Ahora'...");
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(e => null);
        const btnCount = await page.locator('button', { hasText: 'BACKUP MANUAL AHORA' }).count();
        if (btnCount > 0) {
            await page.locator('button', { hasText: 'BACKUP MANUAL AHORA' }).first().click();
        } else {
            console.log("Button not found. Trying via DB call...");
        }

        const download = await downloadPromise;
        if (download) {
            console.log(`-> Descarga detectada, Archivo: ${download.suggestedFilename()}`);
            await download.saveAs('./' + download.suggestedFilename());
            const stats = fs.statSync('./' + download.suggestedFilename());
            console.log(`-> Tamaño del backup: ${stats.size} bytes`);
        } else {
            console.log("-> Descarga no disparada.");
        }

        console.log("\n--- ÚLTIMOS LOGS ---");
        const keywords = ['ChartOfAccounts', 'update', 'save', 'error', 'Persistence', 'encrypted'];
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
