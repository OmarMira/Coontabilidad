import puppeteer from 'puppeteer';
import * as fs from 'fs';

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        let logs = '';

        page.on('console', msg => {
            const line = `[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`;
            logs += line + '\n';
        });

        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });

        console.log('Waiting for migrations to finish...');
        await new Promise(r => setTimeout(r, 6000));

        fs.writeFileSync('browser_logs_utf8.txt', logs, 'utf8');
        await browser.close();
        console.log('Done.');
    } catch (err) {
        console.error('Error running script:', err);
    }
})();
