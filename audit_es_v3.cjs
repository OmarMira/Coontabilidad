const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, results);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src');
const usedKeys = new Set();
// Pattern to match t('key') or t("key") or t(`key`)
const pattern = /\bt\(\s*['"`]([^'"`]+)['"`]/g;

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = pattern.exec(content)) !== null) {
        if (!match[1].includes('${')) { // Skip keys with template literals for now
            usedKeys.add(match[1]);
        }
    }
});

const es = JSON.parse(fs.readFileSync('./src/assets/locales/es.json', 'utf8'));

function keyExists(key, obj) {
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) {
            // Try lowercase if not found
            if (current && typeof current === 'object') {
                const lowerPart = part.toLowerCase();
                const foundKey = Object.keys(current).find(k => k.toLowerCase() === lowerPart);
                if (foundKey) {
                    current = current[foundKey];
                    continue;
                }
            }
            return false;
        }
        current = current[part];
    }
    return true;
}

const missing = [];
usedKeys.forEach(key => {
    if (!keyExists(key, es)) {
        missing.push(key);
    }
});

console.log(`\n📊 RESUMEN DE AUDITORÍA:`);
console.log(`✅ Claves detectadas en código: ${usedKeys.size}`);
console.log(`❌ Claves faltantes en es.json: ${missing.length}`);

if (missing.length > 0) {
    console.log(`\n⚠️  CLAVES FALTANTES:\n`);
    missing.sort().forEach(key => console.log(`   - ${key}`));
} else {
    console.log(`\n🎉 ¡PERFECTO! Todas las claves fijas están presentes.`);
}
