/**
 * RoleManager.tsx - AVAILABLE_MODULES translation keys
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // Modules
    "roleManager.modules.dashboard": "Dashboard",
    "roleManager.modules.customers": "Clientes",
    "roleManager.modules.suppliers": "Proveedores",
    "roleManager.modules.products": "Productos",
    "roleManager.modules.invoices": "Ventas/Facturas",
    "roleManager.modules.bills": "Compras/Gastos",
    "roleManager.modules.accounting": "Contabilidad",
    "roleManager.modules.settings": "Configuración",

    // Actions - Common
    "roleManager.actions.view": "Ver",
    "roleManager.actions.create": "Crear",
    "roleManager.actions.edit": "Editar",
    "roleManager.actions.delete": "Eliminar",
    "roleManager.actions.approve": "Aprobar",

    // Actions - Accounting specific
    "roleManager.actions.viewChartOfAccounts": "Ver Plan Ctas",
    "roleManager.actions.createJournal": "Crear Asiento",
    "roleManager.actions.editJournal": "Editar Asiento",
    "roleManager.actions.viewReports": "Ver Reportes",
    "roleManager.actions.closePeriod": "Cierre Periodo",

    // Actions - Settings specific
    "roleManager.actions.viewCompany": "Ver Empresa",
    "roleManager.actions.manageUsers": "Usuarios",
    "roleManager.actions.manageRoles": "Roles",

    // Button text
    "roleManager.button.update": "Actualizar",
    "roleManager.button.createRole": "Crear Rol"
};

const enKeys = {
    // Modules
    "roleManager.modules.dashboard": "Dashboard",
    "roleManager.modules.customers": "Customers",
    "roleManager.modules.suppliers": "Suppliers",
    "roleManager.modules.products": "Products",
    "roleManager.modules.invoices": "Sales/Invoices",
    "roleManager.modules.bills": "Purchases/Expenses",
    "roleManager.modules.accounting": "Accounting",
    "roleManager.modules.settings": "Settings",

    // Actions - Common
    "roleManager.actions.view": "View",
    "roleManager.actions.create": "Create",
    "roleManager.actions.edit": "Edit",
    "roleManager.actions.delete": "Delete",
    "roleManager.actions.approve": "Approve",

    // Actions - Accounting specific
    "roleManager.actions.viewChartOfAccounts": "View Chart of Accounts",
    "roleManager.actions.createJournal": "Create Journal Entry",
    "roleManager.actions.editJournal": "Edit Journal Entry",
    "roleManager.actions.viewReports": "View Reports",
    "roleManager.actions.closePeriod": "Close Period",

    // Actions - Settings specific
    "roleManager.actions.viewCompany": "View Company",
    "roleManager.actions.manageUsers": "Users",
    "roleManager.actions.manageRoles": "Roles",

    // Button text
    "roleManager.button.update": "Update",
    "roleManager.button.createRole": "Create Role"
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

console.log('\n✅ RoleManager AVAILABLE_MODULES translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
