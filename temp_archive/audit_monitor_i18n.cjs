/**
 * AuditTrailMonitor.tsx - Missing translation keys
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    "auditTrail.status.secure": "Cadena Segura",
    "auditTrail.status.compromised": "Integridad Comprometida",
    "auditTrail.status.verifying": "Verificando...",
    "auditTrail.status.unknown": "Estado Desconocido",
    "auditTrail.verification.success": "Verificación SHA-256 Exitosa",
    "auditTrail.verification.errors": "Se detectaron {count} errores",
    "auditTrail.verification.calculating": "Calculando hashes..."
};

const enKeys = {
    "auditTrail.status.secure": "Secure Chain",
    "auditTrail.status.compromised": "Integrity Compromised",
    "auditTrail.status.verifying": "Verifying...",
    "auditTrail.status.unknown": "Unknown Status",
    "auditTrail.verification.success": "SHA-256 Verification Successful",
    "auditTrail.verification.errors": "{count} errors detected",
    "auditTrail.verification.calculating": "Calculating hashes..."
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);

        Object.keys(updates).forEach(key => {
            json[key] = updates[key];
        });

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with ${Object.keys(updates).length} keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esKeys);
update(enFile, enKeys);

console.log('\n✅ AuditTrailMonitor translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
