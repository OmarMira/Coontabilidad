const fs = require('fs');
const path = require('path');

const targetNamespaces = ['dr15', 'inv', 'maintenance', 'payroll'];
const usageMap = {};
const outputFile = 'missing_namespaces_analysis.txt';
let outputBuffer = '';

function log(msg) {
    console.log(msg);
    outputBuffer += msg + '\n';
}

targetNamespaces.forEach(ns => usageMap[ns] = {});

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            targetNamespaces.forEach(ns => {
                const regex = new RegExp(`t\\(['"](${ns}\\.[^'"]+)['"]\\)`, 'g');
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const fullKey = match[1];
                    if (!usageMap[ns][filePath]) {
                        usageMap[ns][filePath] = new Set();
                    }
                    usageMap[ns][filePath].add(fullKey);
                }
            });
        }
    });
}

log("--- ANALISIS DETALLADO DE USOS ---");

try {
    walk('./src/components');

    targetNamespaces.forEach(ns => {
        log(`\nNAMESPACE: ${ns}`);
        const files = Object.keys(usageMap[ns]);
        if (files.length === 0) {
            log("  (No se encontraron usos explícitos en componentes con t('...'))");
        } else {
            log("  COMPONENTES AFECTADOS:");
            files.forEach(f => {
                log(`  - ${f}`);
                const keys = Array.from(usageMap[ns][f]);
                log("    Claves usadas:");
                keys.forEach(k => log(`      - ${k}`));
            });
        }
    });
} catch (e) {
    log(`Error scanning files: ${e.message}`);
}

log("\n--- BUSQUEDA EN JSON (Alternativas) ---");

try {
    const en = require('./src/assets/locales/en.json');
    const rootKeys = Object.keys(en);

    function searchJson(obj, keyToFind, currentPath = '') {
        let results = [];
        Object.keys(obj).forEach(k => {
            const newPath = currentPath ? `${currentPath}.${k}` : k;
            if (k.toLowerCase() === keyToFind.toLowerCase()) {
                results.push(newPath);
            }
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                results = results.concat(searchJson(obj[k], keyToFind, newPath));
            }
        });
        return results;
    }

    targetNamespaces.forEach(ns => {
        log(`\nBuscando '${ns}' en en.json:`);
        if (rootKeys.includes(ns)) {
            log(`  ✅ EXISTE como root key directo.`);
        } else {
            log(`  ❌ NO EXISTE como root key directo.`);

            // Search deeper
            const matches = searchJson(en, ns);
            if (matches.length > 0) {
                log("  ⚠️ Se encontraron coincidencias anidadas:");
                matches.forEach(m => log(`    - ${m}`));
            } else {
                log("  No se encontraron coincidencias de nombre exacto en ninguna profundidad.");

                // Try partial match if exact failed?
                // Let's keep it simple for now as per request
            }
        }
    });

} catch (e) {
    log(`Error reading en.json: ${e.message}`);
}

fs.writeFileSync(outputFile, outputBuffer);
log(`\nReporte guardado en: ${outputFile}`);
