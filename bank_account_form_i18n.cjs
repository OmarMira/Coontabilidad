/**
 * BankAccountForm.tsx - Translation keys
 * Modal for syncing/editing bank accounts
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // Modal titles
    "bankAccountForm.title.create": "Sincronizar Nueva Cuenta",
    "bankAccountForm.title.edit": "Ajustar Bóveda",
    "bankAccountForm.subtitle": "Banking Forensic Protocol v5.1",

    // Form labels
    "bankAccountForm.label.accountAlias": "Alias de la Cuenta",
    "bankAccountForm.label.bankEntity": "Entidad Bancaria",
    "bankAccountForm.label.classification": "Clasificación",
    "bankAccountForm.label.currency": "Divisa",
    "bankAccountForm.label.accountId": "Identificador de Cuenta",
    "bankAccountForm.label.routing": "Número de Ruta (Routing)",
    "bankAccountForm.label.initialBalance": "Saldo Inicial",
    "bankAccountForm.label.memo": "Memorándum Interno",

    // Placeholders
    "bankAccountForm.placeholder.accountAlias": "CUENTA OPERATIVA ALPHA",
    "bankAccountForm.placeholder.bankEntity": "CHASE / BOFA / WELLS",
    "bankAccountForm.placeholder.accountId": "XXXX-XXXX-XXXX",
    "bankAccountForm.placeholder.routing": "XXXXXXXXX",
    "bankAccountForm.placeholder.memo": "NOTAS TÉCNICAS DE AUDITORÍA...",

    // Account types
    "bankAccountForm.type.checking": "CUENTA CORRIENTE (CHECKING)",
    "bankAccountForm.type.savings": "CUENTA DE AHORROS (SAVINGS)",
    "bankAccountForm.type.credit": "TARJETA DE CRÉDITO",
    "bankAccountForm.type.other": "OTRO ACTIVO",

    // Currencies
    "bankAccountForm.currency.usd": "USD - DÓLAR AMERICANO",
    "bankAccountForm.currency.eur": "EUR - EURO",
    "bankAccountForm.currency.mxn": "MXN - PESO MEXICANO",

    // Status
    "bankAccountForm.status.active": "ACTIVA",
    "bankAccountForm.status.inactive": "INACTIVA",
    "bankAccountForm.status.label": "Estado:",

    // Buttons
    "bankAccountForm.button.cancel": "Abortar Proceso",
    "bankAccountForm.button.save": "Sincronizar Bóveda",
    "bankAccountForm.button.update": "Confirmar Ajustes",

    // Validation errors
    "bankAccountForm.error.nameRequired": "Nombre mandatorio",
    "bankAccountForm.error.bankRequired": "Entidad mandatoria",
    "bankAccountForm.error.accountIdRequired": "Identificador mandatorio"
};

const enKeys = {
    // Modal titles
    "bankAccountForm.title.create": "Sync New Account",
    "bankAccountForm.title.edit": "Adjust Vault",
    "bankAccountForm.subtitle": "Banking Forensic Protocol v5.1",

    // Form labels
    "bankAccountForm.label.accountAlias": "Account Alias",
    "bankAccountForm.label.bankEntity": "Bank Entity",
    "bankAccountForm.label.classification": "Classification",
    "bankAccountForm.label.currency": "Currency",
    "bankAccountForm.label.accountId": "Account Identifier",
    "bankAccountForm.label.routing": "Routing Number",
    "bankAccountForm.label.initialBalance": "Initial Balance",
    "bankAccountForm.label.memo": "Internal Memorandum",

    // Placeholders
    "bankAccountForm.placeholder.accountAlias": "ALPHA OPERATING ACCOUNT",
    "bankAccountForm.placeholder.bankEntity": "CHASE / BOFA / WELLS",
    "bankAccountForm.placeholder.accountId": "XXXX-XXXX-XXXX",
    "bankAccountForm.placeholder.routing": "XXXXXXXXX",
    "bankAccountForm.placeholder.memo": "TECHNICAL AUDIT NOTES...",

    // Account types
    "bankAccountForm.type.checking": "CHECKING ACCOUNT",
    "bankAccountForm.type.savings": "SAVINGS ACCOUNT",
    "bankAccountForm.type.credit": "CREDIT CARD",
    "bankAccountForm.type.other": "OTHER ASSET",

    // Currencies
    "bankAccountForm.currency.usd": "USD - US DOLLAR",
    "bankAccountForm.currency.eur": "EUR - EURO",
    "bankAccountForm.currency.mxn": "MXN - MEXICAN PESO",

    // Status
    "bankAccountForm.status.active": "ACTIVE",
    "bankAccountForm.status.inactive": "INACTIVE",
    "bankAccountForm.status.label": "Status:",

    // Buttons
    "bankAccountForm.button.cancel": "Abort Process",
    "bankAccountForm.button.save": "Sync Vault",
    "bankAccountForm.button.update": "Confirm Adjustments",

    // Validation errors
    "bankAccountForm.error.nameRequired": "Name required",
    "bankAccountForm.error.bankRequired": "Bank required",
    "bankAccountForm.error.accountIdRequired": "Identifier required"
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

console.log('\n✅ BankAccountForm translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
