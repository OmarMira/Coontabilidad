// Archivo: audit_es_keys.cjs
const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, results);
        } else if (filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src/components');
const usedKeys = new Set();
const pattern = /t\(['"]([^'"]+)['"]\)/g;

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = pattern.exec(content)) !== null) {
        usedKeys.add(match[1]);
    }
});

const es = require('./src/locales/es.json');

function keyExists(key, obj) {
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) {
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
console.log(`✅ Claves usadas en código: ${usedKeys.size}`);
console.log(`❌ Claves faltantes en es.json: ${missing.length}`);

if (missing.length > 0) {
    console.log(`\n⚠️  CLAVES FALTANTES:\n`);
    missing.sort().forEach(key => console.log(`   - ${key}`));

    console.log(`\n💡 ACCIÓN REQUERIDA: Agregar estas claves a es.json`);
} else {
    console.log(`\n🎉 ¡PERFECTO! Todas las claves están presentes.`);
}
