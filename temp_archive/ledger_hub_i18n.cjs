
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ledgerHub.title": "Unidad Contable",
    "ledgerHub.subtitle": "Ledger Control & Audit Hub",
    "ledgerHub.controlCenter": "Centro de Control",
    "ledgerHub.journalEntries": "Asientos Diario",
    "ledgerHub.ledgerValidation": "Validación Mayor",
    "ledgerHub.auxiliaries": "Auxiliares / Terceros",
    "ledgerHub.dailyBook": "Libro Diario",
    "ledgerHub.dailyBookDesc": "Registro cronológico de asientos. Visibilidad total de transacciones financieras.",
    "ledgerHub.generalLedger": "Libro Mayor",
    "ledgerHub.generalLedgerDesc": "Agregación de saldos por cuenta contable. Base indispensable para reportes fiscales.",
    "ledgerHub.auxiliariesTitle": "Auxiliares",
    "ledgerHub.auxiliariesDesc": "Seguimiento detallado por tercero, cliente y proveedor. Precisión micrométrica.",
    "ledgerHub.realTimeSync": "Sincronizado en Tiempo Real",
    "ledgerHub.lastClosure": "Último Cierre: {date}",
    "ledgerHub.validatedUsGaap": "Validación US GAAP Activa",
    "ledgerHub.errorTitle": "Inconsistencia en el Módulo",
    "ledgerHub.errorDesc": "El motor de renderizado detectó un fallo crítico en la carga de libros auxiliares.",
    "ledgerHub.restartProtocols": "Reiniciar Protocolos"
};

const enUpdates = {
    "ledgerHub.title": "Accounting Unit",
    "ledgerHub.subtitle": "Ledger Control & Audit Hub",
    "ledgerHub.controlCenter": "Control Center",
    "ledgerHub.journalEntries": "Journal Entries",
    "ledgerHub.ledgerValidation": "Ledger Validation",
    "ledgerHub.auxiliaries": "Auxiliaries / Third Parties",
    "ledgerHub.dailyBook": "Daily Book",
    "ledgerHub.dailyBookDesc": "Chronological record of entries. Full visibility of financial transactions.",
    "ledgerHub.generalLedger": "General Ledger",
    "ledgerHub.generalLedgerDesc": "Aggregation of balances by accounting account. Indispensable base for tax reports.",
    "ledgerHub.auxiliariesTitle": "Auxiliaries",
    "ledgerHub.auxiliariesDesc": "Detailed tracking by third party, customer, and supplier. Micrometric precision.",
    "ledgerHub.realTimeSync": "Synchronized in Real Time",
    "ledgerHub.lastClosure": "Last Closure: {date}",
    "ledgerHub.validatedUsGaap": "US GAAP Validation Active",
    "ledgerHub.errorTitle": "Module Inconsistency",
    "ledgerHub.errorDesc": "The rendering engine detected a critical failure in loading auxiliary books.",
    "ledgerHub.restartProtocols": "Restart Protocols"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file}`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);
