const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Ensure artifacts directory exists
const artifactsDir = 'C:\\Users\\PC Omar\\.gemini\\antigravity\\brain\\5c73b835-1f4d-4119-b78d-9fa991322ebf\\artifacts';
if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
}

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true }); // Make sure headless is true for the test env
        const context = await browser.newContext();
        const page = await context.newPage();

        let logs = [];
        page.on('console', msg => {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        });

        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000); // give app time to initialize db

        // Go to Chart of Accounts
        console.log("Navigating to Plan de Cuentas...");
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'accounts' }));
        });
        await page.waitForTimeout(3000);

        // Edit first account
        const editButtons = page.locator('button:has(.lucide-pencil), button:has-text("Editar")');
        const numEditBtns = await editButtons.count();
        if (numEditBtns > 0) {
            console.log(`Found ${numEditBtns} edit buttons. Clicking the first one...`);
            await editButtons.first().click({ force: true });
            await page.waitForTimeout(1000);

            // Change name of account
            const nameInput = page.locator('input[placeholder*="Nombre"], input[value*="EFECTIVO"]');
            const originalVal = await nameInput.first().inputValue().catch(e => '');
            const newVal = originalVal + ' UPDATED';
            await nameInput.first().fill(newVal);
            console.log(`Changing account name from "${originalVal}" to "${newVal}"`);

            // Save
            await page.locator('button', { hasText: 'Guardar' }).first().click().catch(async (e) => {
                const submitBtn = page.locator('button[type="submit"]');
                if (await submitBtn.count() > 0) {
                    await submitBtn.first().click();
                } else {
                    console.log("No save button found");
                }
            });
            await page.waitForTimeout(2000); // wait for save and re-render

            const successPath = path.join(artifactsDir, 'plan_de_cuentas_post_edit.png');
            await page.screenshot({ path: successPath });
            console.log(`[Screenshot 1] Plan de Cuentas list after saving: ${successPath}`);
        } else {
            console.log("No edit buttons found in UI.");
        }

        // Check account count
        console.log("\n--- EXECUTING CONSOLE CHECKS ---");
        const countAccounts = await page.evaluate(() => {
            try {
                return window.__db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0].values[0][0];
            } catch (e) { return 'Error: ' + e; }
        });
        console.log(`Account Count: ${countAccounts}`);

        console.log("\n--- LAST 5 RELEVANT LOGS ---");
        const keywords = ['ChartOfAccounts', 'update', 'save', 'error'];
        const filteredLogs = logs.filter(l => keywords.some(k => l.toLowerCase().includes(k.toLowerCase())));
        const last5 = filteredLogs.slice(-5);
        last5.forEach(l => console.log(l));
        console.log("----------------------");

        await browser.close();
    } catch (e) {
        console.error("Test execution error:", e);
        if (browser) await browser.close();
    }
})();
