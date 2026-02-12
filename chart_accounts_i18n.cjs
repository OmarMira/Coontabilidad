
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "chartOfAccounts.title": "Plan de Cuentas",
    "chartOfAccounts.subtitle": "Estructura contable jerárquica del sistema",
    "chartOfAccounts.loading": "Cargando Plan de Cuentas...",
    "chartOfAccounts.error": "Error al cargar el plan de cuentas",
    "chartOfAccounts.retry": "Reintentar",
    "chartOfAccounts.newAccount": "Nueva Cuenta",
    "chartOfAccounts.searchPlaceholder": "Buscar por código o nombre...",
    "chartOfAccounts.filterAll": "Todos los tipos",
    "chartOfAccounts.typeAsset": "Activos",
    "chartOfAccounts.typeLiability": "Pasivos",
    "chartOfAccounts.typeEquity": "Patrimonio",
    "chartOfAccounts.typeRevenue": "Ingresos",
    "chartOfAccounts.typeExpense": "Gastos",
    "chartOfAccounts.showInactive": "Mostrar inactivas",
    "chartOfAccounts.colCode": "Código",
    "chartOfAccounts.colName": "Nombre de la Cuenta",
    "chartOfAccounts.colType": "Tipo",
    "chartOfAccounts.colBalance": "Balance",
    "chartOfAccounts.colStatus": "Estado",
    "chartOfAccounts.colActions": "Acciones",
    "chartOfAccounts.noAccountsFound": "No se encontraron cuentas",
    "chartOfAccounts.editAccount": "Editar Cuenta",
    "chartOfAccounts.deleteAccount": "Eliminar Cuenta",
    "chartOfAccounts.deleteConfirm": "¿Está seguro de que desea eliminar la cuenta {code} - {name}?",
    "chartOfAccounts.formCode": "Código de Cuenta",
    "chartOfAccounts.formName": "Nombre de la Cuenta",
    "chartOfAccounts.formType": "Tipo de Cuenta",
    "chartOfAccounts.formBalance": "Balance Normal",
    "chartOfAccounts.formParent": "Cuenta Padre (Opcional)",
    "chartOfAccounts.formActive": "Cuenta activa",
    "chartOfAccounts.update": "Actualizar",
    "chartOfAccounts.create": "Crear",
    "chartOfAccounts.cancel": "Cancelar",
    "chartOfAccounts.debito": "Débito",
    "chartOfAccounts.credito": "Crédito",
    "chartOfAccounts.activo": "Activo",
    "chartOfAccounts.pasivo": "Pasivo",
    "chartOfAccounts.patrimonio": "Patrimonio",
    "chartOfAccounts.ingreso": "Ingreso",
    "chartOfAccounts.gasto": "Gasto",
    "chartOfAccounts.unexpectedError": "Error inesperado",
    "chartOfAccounts.createSuccess": "Cuenta creada exitosamente",
    "chartOfAccounts.updateSuccess": "Cuenta actualizada exitosamente",
    "chartOfAccounts.deleteSuccess": "Cuenta eliminada exitosamente"
};

const enUpdates = {
    "chartOfAccounts.title": "Chart of Accounts",
    "chartOfAccounts.subtitle": "System hierarchical accounting structure",
    "chartOfAccounts.loading": "Loading Chart of Accounts...",
    "chartOfAccounts.error": "Error loading chart of accounts",
    "chartOfAccounts.retry": "Retry",
    "chartOfAccounts.newAccount": "New Account",
    "chartOfAccounts.searchPlaceholder": "Search by code or name...",
    "chartOfAccounts.filterAll": "All types",
    "chartOfAccounts.typeAsset": "Assets",
    "chartOfAccounts.typeLiability": "Liabilities",
    "chartOfAccounts.typeEquity": "Equity",
    "chartOfAccounts.typeRevenue": "Revenue",
    "chartOfAccounts.typeExpense": "Expenses",
    "chartOfAccounts.showInactive": "Show inactive",
    "chartOfAccounts.colCode": "Code",
    "chartOfAccounts.colName": "Account Name",
    "chartOfAccounts.colType": "Type",
    "chartOfAccounts.colBalance": "Balance",
    "chartOfAccounts.colStatus": "Status",
    "chartOfAccounts.colActions": "Actions",
    "chartOfAccounts.noAccountsFound": "No accounts found",
    "chartOfAccounts.editAccount": "Edit Account",
    "chartOfAccounts.deleteAccount": "Delete Account",
    "chartOfAccounts.deleteConfirm": "Are you sure you want to delete account {code} - {name}?",
    "chartOfAccounts.formCode": "Account Code",
    "chartOfAccounts.formName": "Account Name",
    "chartOfAccounts.formType": "Account Type",
    "chartOfAccounts.formBalance": "Normal Balance",
    "chartOfAccounts.formParent": "Parent Account (Optional)",
    "chartOfAccounts.formActive": "Active account",
    "chartOfAccounts.update": "Update",
    "chartOfAccounts.create": "Create",
    "chartOfAccounts.cancel": "Cancel",
    "chartOfAccounts.debito": "Debit",
    "chartOfAccounts.credito": "Credit",
    "chartOfAccounts.activo": "Asset",
    "chartOfAccounts.pasivo": "Liability",
    "chartOfAccounts.patrimonio": "Equity",
    "chartOfAccounts.ingreso": "Revenue",
    "chartOfAccounts.gasto": "Expense",
    "chartOfAccounts.unexpectedError": "Unexpected error",
    "chartOfAccounts.createSuccess": "Account created successfully",
    "chartOfAccounts.updateSuccess": "Account updated successfully",
    "chartOfAccounts.deleteSuccess": "Account deleted successfully"
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
