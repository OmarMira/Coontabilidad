/**
 * BankAccountList.tsx - Complete translation keys
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    "bankAccountList.title": "Matriz Bancaria",
    "bankAccountList.subtitle": "Asset Liquidity Controller v5.0",
    "bankAccountList.search": "BUSCAR CUENTA / ENTIDAD...",
    "bankAccountList.filterAll": "TODOS LOS TIPOS",
    "bankAccountList.syncVault": "Sincronizar Bóveda",
    "bankAccountList.type.checking": "CORRIENTE",
    "bankAccountList.type.savings": "AHORROS",
    "bankAccountList.type.credit": "CRÉDITO",
    "bankAccountList.type.general": "GENERAL",
    "bankAccountList.stats.activeAccounts": "Cuentas Activas",
    "bankAccountList.stats.totalLiquidity": "Liquidez Total",
    "bankAccountList.stats.creditLines": "Líneas de Crédito",
    "bankAccountList.stats.entities": "Entidades",
    "bankAccountList.empty.title": "Bóveda no Detectada",
    "bankAccountList.empty.desc": "No se han mapeado cuentas bancarias bajo estos parámetros.",
    "bankAccountList.card.liquidPosition": "Posición Líquida"
};

const enKeys = {
    "bankAccountList.title": "Banking Matrix",
    "bankAccountList.subtitle": "Asset Liquidity Controller v5.0",
    "bankAccountList.search": "SEARCH ACCOUNT / ENTITY...",
    "bankAccountList.filterAll": "ALL TYPES",
    "bankAccountList.syncVault": "Sync Vault",
    "bankAccountList.type.checking": "CHECKING",
    "bankAccountList.type.savings": "SAVINGS",
    "bankAccountList.type.credit": "CREDIT",
    "bankAccountList.type.general": "GENERAL",
    "bankAccountList.stats.activeAccounts": "Active Accounts",
    "bankAccountList.stats.totalLiquidity": "Total Liquidity",
    "bankAccountList.stats.creditLines": "Credit Lines",
    "bankAccountList.stats.entities": "Entities",
    "bankAccountList.empty.title": "Vault Not Detected",
    "bankAccountList.empty.desc": "No bank accounts have been mapped under these parameters.",
    "bankAccountList.card.liquidPosition": "Liquid Position"
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

console.log('\n✅ BankAccountList translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
