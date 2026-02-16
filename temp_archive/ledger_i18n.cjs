
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ledger.title": "Libro Mayor",
    "ledger.searchAccount": "Buscar Cuenta",
    "ledger.searchPlaceholder": "Código / Nombre...",
    "ledger.structure": "Estructura",
    "ledger.all": "Todas",
    "ledger.from": "Desde",
    "ledger.to": "Hasta",
    "ledger.masterPlan": "Plan Maestro",
    "ledger.export": "Exportar Libro",
    "ledger.querying": "Ejecutando Query Maestro...",
    "ledger.opening": "Apertura",
    "ledger.debits": "Débitos",
    "ledger.credits": "Créditos",
    "ledger.finalPointer": "Puntero Final",
    "ledger.date": "Fecha",
    "ledger.accountingRef": "Referencia Contable",
    "ledger.movementDescription": "Descripción de Movimiento",
    "ledger.accumulatedBalance": "Saldo Acumulado",
    "ledger.selectNode": "Seleccione Nodo Contable",
    "ledger.selectNodeHelp": "Debe elegir una cuenta del Plan Maestro para proyectar su Libro Mayor detallado."
};

const enUpdates = {
    "ledger.title": "General Ledger",
    "ledger.searchAccount": "Search Account",
    "ledger.searchPlaceholder": "Code / Name...",
    "ledger.structure": "Structure",
    "ledger.all": "All",
    "ledger.from": "From",
    "ledger.to": "To",
    "ledger.masterPlan": "Master Plan",
    "ledger.export": "Export Ledger",
    "ledger.querying": "Executing Master Query...",
    "ledger.opening": "Opening",
    "ledger.debits": "Debits",
    "ledger.credits": "Credits",
    "ledger.finalPointer": "Final Pointer",
    "ledger.date": "Date",
    "ledger.accountingRef": "Accounting Reference",
    "ledger.movementDescription": "Movement Description",
    "ledger.accumulatedBalance": "Accumulated Balance",
    "ledger.selectNode": "Select Accounting Node",
    "ledger.selectNodeHelp": "You must choose an account from the Master Plan to project its detailed General Ledger."
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
