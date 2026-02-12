
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "journal.title": "Libro Diario",
    "journal.subtitle": "Registros Auxiliares e Historial de Auditoría",
    "journal.newEntry": "Nuevo Registro Manual",
    "journal.verifiedEntries": "Asientos Verificados",
    "journal.filterHistory": "Filtrar Historial",
    "journal.noEntries": "Cero registros en este nodo",
    "journal.fiscalDate": "Fecha Fiscal",
    "journal.auditRef": "Ref. Auditoría",
    "journal.description": "Glosa / Descripción",
    "journal.totalDR": "Total DR",
    "journal.totalCR": "Total CR",
    "journal.status": "Estado",
    "journal.folioInitiator": "Iniciador de Folio",
    "journal.standardUSGAAP": "Sincronización de Partida Doble • US GAAP Standard",
    "journal.internalRef": "Referencia Interna",
    "journal.internalRefPlaceholder": "Ej: AST-001",
    "journal.generalGloss": "Glosa General",
    "journal.generalGlossPlaceholder": "Descripción detallada del movimiento contable...",
    "journal.account": "Cuenta Contable",
    "journal.selectNode": "-- SELECCIONAR NODO --",
    "journal.lineDetail": "Detalle Línea",
    "journal.lineDetailPlaceholder": "Concepto por línea...",
    "journal.debit": "Débito (DR)",
    "journal.credit": "Abono (CR)",
    "journal.expandEntry": "Expandir Asiento",
    "journal.validatedProtocol": "Protocolo Validado",
    "journal.outOfBalance": "Fuera de Balance",
    "journal.imbalance": "DESCUADRE:",
    "journal.discard": "Descartar",
    "journal.syncLedger": "Sincronizar Ledger",
    "journal.syncError": "Fallo en sincronización de diario",
    "journal.doubleEntryError": "El asiento no cumple con partida doble",
    "journal.registeredSuccess": "Asiento registrado y validado",
    "journal.persistenceError": "Error crítico en persistencia: "
};

const enUpdates = {
    "journal.title": "General Journal",
    "journal.subtitle": "Subsidiary Records and Audit Trail",
    "journal.newEntry": "New Manual Entry",
    "journal.verifiedEntries": "Verified Entries",
    "journal.filterHistory": "Filter History",
    "journal.noEntries": "Zero records in this node",
    "journal.fiscalDate": "Fiscal Date",
    "journal.auditRef": "Audit Ref.",
    "journal.description": "Gloss / Description",
    "journal.totalDR": "Total DR",
    "journal.totalCR": "Total CR",
    "journal.status": "Status",
    "journal.folioInitiator": "Folio Initiator",
    "journal.standardUSGAAP": "Double Entry Sync • US GAAP Standard",
    "journal.internalRef": "Internal Reference",
    "journal.internalRefPlaceholder": "e.g., AST-001",
    "journal.generalGloss": "General Description",
    "journal.generalGlossPlaceholder": "Detailed description of the accounting movement...",
    "journal.account": "Accounting Account",
    "journal.selectNode": "-- SELECT NODE --",
    "journal.lineDetail": "Line Detail",
    "journal.lineDetailPlaceholder": "Concept per line...",
    "journal.debit": "Debit (DR)",
    "journal.credit": "Credit (CR)",
    "journal.expandEntry": "Expand Entry",
    "journal.validatedProtocol": "Validated Protocol",
    "journal.outOfBalance": "Out of Balance",
    "journal.imbalance": "IMBALANCE:",
    "journal.discard": "Discard",
    "journal.syncLedger": "Sync Ledger",
    "journal.syncError": "Journal synchronization failure",
    "journal.doubleEntryError": "Entry does not comply with double entry",
    "journal.registeredSuccess": "Entry registered and validated",
    "journal.persistenceError": "Critical persistence error: "
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
