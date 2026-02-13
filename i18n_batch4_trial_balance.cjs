const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'src/assets/locales/es.json');
const enPath = path.join(__dirname, 'src/assets/locales/en.json');

console.log('Reading from:', esPath);

let es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

es.trialBalance = {
    "title": "Balance de Comprobación",
    "protocol": "Protocolo Estándar",
    "periodLabel": "Período",
    "codeHeader": "Código",
    "descHeader": "Descripción",
    "natHeader": "Nat",
    "prevBalance": "Saldo Anterior",
    "debits": "Débitos",
    "credits": "Créditos",
    "closingBalance": "Saldo Cierre",
    "openingBalance": "Saldo Inicial",
    "debitFlow": "Flujo Débito",
    "creditFlow": "Flujo Crédito",
    "integrity": "Integridad",
    "calibrated": "Calibrado",
    "error": "Descuadre",
    "subtitle": "Matriz de Datos del Período",
    "syncing": "Sincronizando...",
    "noMovements": "Sin Movimientos",
    "repairStructure": "Reparar Estructura",
    "injectDemo": "Inyectar Demo",
    "auditConsolidation": "Consolidación Auditoría",
    "debitConsumption": "Consumo Débito",
    "creditConsumption": "Consumo Crédito",
    "integrityBook": "Libro Íntegro",
    "criticalImbalance": "Desbalance Crítico",
    "diff": "Diferencia",
    "repairConfirmation": "¿Está seguro de generar datos de prueba? Esto afectará los saldos actuales.",
    "sessionID": "Identificador de Sesión",
    "viewLedger": "Ver Auxilio Contable"
};

en.trialBalance = {
    "title": "Trial Balance",
    "protocol": "Standard Protocol",
    "periodLabel": "Period",
    "codeHeader": "Code",
    "descHeader": "Description",
    "natHeader": "Nat",
    "prevBalance": "Prev Balance",
    "debits": "Debits",
    "credits": "Credits",
    "closingBalance": "Closing Balance",
    "openingBalance": "Opening Balance",
    "debitFlow": "Debit Flow",
    "creditFlow": "Credit Flow",
    "integrity": "Integrity",
    "calibrated": "Calibrated",
    "error": "Error",
    "subtitle": "Period Data Matrix",
    "syncing": "Syncing...",
    "noMovements": "No Movements",
    "repairStructure": "Repair Structure",
    "injectDemo": "Inject Demo",
    "auditConsolidation": "Audit Consolidation",
    "debitConsumption": "Debit Consumption",
    "creditConsumption": "Credit Consumption",
    "integrityBook": "Balanced Book",
    "criticalImbalance": "Critical Imbalance",
    "diff": "Diff",
    "repairConfirmation": "Are you sure you want to generate test data? This will affect current balances.",
    "sessionID": "Session ID",
    "viewLedger": "View Ledger"
};

fs.writeFileSync(esPath, JSON.stringify(es, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Batch 4 (Direct Assignment) completed.');
