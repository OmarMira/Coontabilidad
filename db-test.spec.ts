import { test, expect } from '@playwright/test';

test('verify login', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(4000); // Wait for initialization

    console.log("=== BROWSER LOGS (FIRST 20) ===");
    console.log(logs.slice(0, 20).join('\n'));
    console.log("===============================");

    // Attempt login
    await page.fill('input[type="text"]', 'admin@empresa.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000); // Wait for login response

    console.log("=== BROWSER LOGS (AFTER LOGIN) ===");
    const afterLogs = logs.slice(logs.length > 20 ? logs.length - 10 : 0);
    console.log(afterLogs.join('\n'));
    console.log("===============================");

    // Check if error is displayed
    const errorMsg = await page.locator('.text-red-500').first().isVisible();
    if (errorMsg) {
        console.log("LOGIN FAILED: Error message is visible on screen.");
    } else {
        console.log("LOGIN SUCCESS: No error message on screen.");
    }
});
