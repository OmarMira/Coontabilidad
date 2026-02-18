const fs = require('fs');
const readline = require('readline');

async function listRootKeys(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log(`Root keys in ${filePath}:`);
    for await (const line of rl) {
        // Look for lines that start with exactly 2 spaces, then a double quote, then some text, then another double quote, then a colon
        const match = line.match(/^  "([^"]+)":/);
        if (match) {
            process.stdout.write(`"${match[1]}", `);
        }
    }
    console.log('\n');
}

(async () => {
    await listRootKeys('c:/Account Express/src/assets/locales/en.json');
    await listRootKeys('c:/Account Express/src/assets/locales/es.json');
})();
