// Archivo: validate_es.cjs
const fs = require('fs');

try {
    const es = JSON.parse(fs.readFileSync('./src/assets/locales/es.json', 'utf8'));
    console.log('✅ es.json es JSON válido');
    console.log(`📊 Namespaces encontrados: ${Object.keys(es).length}`);
    console.log('📋 Lista de namespaces:');
    Object.keys(es).sort().forEach(ns => {
        const keyCount = typeof es[ns] === 'object' ? Object.keys(es[ns]).length : 1;
        console.log(`   - ${ns}: ${keyCount} claves`);
    });
} catch (err) {
    console.error('❌ ERROR en es.json:', err.message);
    process.exit(1);
}
