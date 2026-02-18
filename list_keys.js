const fs = require('fs');

function listRootKeys(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        console.log(`Root keys in ${filePath}:`);
        console.log(Object.keys(json).join(', '));
    } catch (e) {
        console.error(`Error parsing ${filePath}: ${e.message}`);
    }
}

listRootKeys('c:/Account Express/src/assets/locales/en.json');
listRootKeys('c:/Account Express/src/assets/locales/es.json');
