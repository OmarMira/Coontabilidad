const fs = require('fs');

const es = JSON.parse(fs.readFileSync('./src/locales/es.json', 'utf8'));

const placeholders = [];

function checkObject(obj, path = '') {
    for (let key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
            checkObject(value, currentPath);
        } else if (typeof value === 'string') {
            // Check for technical values
            if (value.includes('.') && value.split('.').length > 1) {
                placeholders.push({ path: currentPath, value, reason: 'Technical Path' });
            } else if (value.toLowerCase() === 'title' || value.toLowerCase() === 'subtitle' || value.toLowerCase() === 'desc' || value.toLowerCase() === 'description') {
                placeholders.push({ path: currentPath, value, reason: 'Generic Placeholder' });
            } else if (value.toLowerCase() === 'label' || value.toLowerCase() === 'name') {
                placeholders.push({ path: currentPath, value, reason: 'Generic Label' });
            } else if (value.toLowerCase() === 'placeholder') {
                placeholders.push({ path: currentPath, value, reason: 'Generic Placeholder Tag' });
            }
        }
    }
}

checkObject(es);

console.log(`\n📊 HALLAZGOS DE TRADUCCIÓN TÉCNICA/PLACEHOLDERS:`);
console.log(`❌ Total de valores sospechosos: ${placeholders.length}`);

if (placeholders.length > 0) {
    // Group by category for easier review
    const categories = {};
    placeholders.forEach(p => {
        if (!categories[p.reason]) categories[p.reason] = [];
        categories[p.reason].push(p);
    });

    for (let cat in categories) {
        console.log(`\n⚠️  CATEGORÍA: ${cat} (${categories[cat].length})\n`);
        categories[cat].slice(0, 20).forEach(p => console.log(`   - ${p.path}: "${p.value}"`));
        if (categories[cat].length > 20) console.log(`   ... y ${categories[cat].length - 20} más`);
    }
}
