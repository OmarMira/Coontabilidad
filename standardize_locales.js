const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

// Custom merge that handles string vs object conflicts
function smartMerge(target, source) {
    if (!target) return source;
    if (typeof target !== typeof source) {
        // If one is an object and the other is not, prefer the object
        if (typeof source === 'object') return source;
        return target;
    }
    if (typeof source === 'object' && source !== null) {
        for (const key in source) {
            target[key] = smartMerge(target[key], source[key]);
        }
    } else {
        return source; // Prefer the new value for strings
    }
    return target;
}

function standardize(filePath) {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Attempt to fix some common syntax issues before parsing
    content = content.replace(/}\s*"/g, '},\n  "'); // missing commas
    content = content.replace(/}\s*}/g, '}\n}'); // potentially missing commas or double braces

    let json;
    try {
        // We might have duplicate keys which standard JSON.parse handles by taking the last one.
        // But the user wants a clean merge.
        // I'll parse it manually if needed, or just use a trick:
        // Regular JSON.parse will give us the last occurrence.
        json = JSON.parse(content);
    } catch (e) {
        console.error(`Failed to parse ${filePath}: ${e.message}`);
        return null;
    }

    const cleaned = {};
    // Sort keys for consistency
    const sortedKeys = Object.keys(json).sort();

    for (const key of sortedKeys) {
        cleaned[key] = json[key];
    }

    return cleaned;
}

const enPath = 'c:/Account Express/src/assets/locales/en.json';
const esPath = 'c:/Account Express/src/assets/locales/es.json';

const en = standardize(enPath);
const es = standardize(esPath);

if (en && es) {
    // Ensure Parity: Add missing keys from En to Es (and vice versa if needed)
    // Actually, usually En is the source of truth for keys.
    const enKeys = Object.keys(en);
    const esKeys = Object.keys(es);

    const allKeys = Array.from(new Set([...enKeys, ...esKeys])).sort();

    const finalEn = {};
    const finalEs = {};

    allKeys.forEach(key => {
        finalEn[key] = en[key] || `MISSING_IN_EN: ${key}`;
        finalEs[key] = es[key] || `MISSING_IN_ES: ${key}`;
    });

    fs.writeFileSync(enPath, JSON.stringify(finalEn, null, 2), 'utf8');
    fs.writeFileSync(esPath, JSON.stringify(finalEs, null, 2), 'utf8');
    console.log('Standardization complete.');
}
