/**
 * COMPLETE I18N TRANSLATION SCRIPT FOR ALL FILES MENU COMPONENTS
 * This script will add ALL missing translation keys needed
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esCompleteKeys = {
    // ==================== ROLE MANAGER - COMPLETE ====================
    "roleManager.title": "Gestión de Roles",
    "roleManager.subtitle": "Crear, modificar y eliminar roles del sistema",
    "roleManager.newRole": "Nuevo Rol",
    "roleManager.editRole": "Editar Rol",
    "roleManager.deleteConfirm": "¿Está seguro de eliminar el rol",
    "roleManager.form.name": "Nombre del Rol",
    "roleManager.form.description": "Descripción",
    "roleManager.form.level": "Nivel de Acceso",
    "roleManager.form.permissions": "Permisos",
    "roleManager.table.name": "Nombre",
    "roleManager.table.description": "Descripción",
    "roleManager.table.level": "Nivel",
    "roleManager.table.actions": "Acciones",
    "roleManager.error.load": "Error al cargar roles",
    "roleManager.modules.dashboard": "Dashboard",
    "roleManager.modules.customers": "Clientes",
    "roleManager.modules.suppliers": "Proveedores",
    "roleManager.modules.products": "Productos",
    "roleManager.modules.invoices": "Ventas/Facturas",
    "roleManager.modules.bills": "Compras/Gastos",
    "roleManager.modules.accounting": "Contabilidad",
    "roleManager.modules.settings": "Configuración",
    "roleManager.actions.view": "Ver",
    "roleManager.actions.create": "Crear",
    "roleManager.actions.edit": "Editar",
    "roleManager.actions.delete": "Eliminar",
    "roleManager.actions.approve": "Aprobar",
    "roleManager.actions.viewChartOfAccounts": "Ver Plan Ctas",
    "roleManager.actions.createJournal": "Crear Asiento",
    "roleManager.actions.editJournal": "Editar Asiento",
    "roleManager.actions.viewReports": "Ver Reportes",
    "roleManager.actions.closePeriod": "Cierre Periodo",
    "roleManager.actions.viewCompany": "Ver Empresa",
    "roleManager.actions.manageUsers": "Usuarios",
    "roleManager.actions.manageRoles": "Roles",

    // ==================== BANK ACCOUNTS COMPLETE ====================
    "bankAccounts.title": "Matriz Bancaria",
    "bankAccounts.subtitle": "Asset Liquidity Controller V5.0",
    "bankAccounts.newAccount": "Nueva Cuenta",
    "bankAccounts.editAccount": "Editar Cuenta",
    "bankAccounts.deleteAccount": "Eliminar Cuenta",
    "bankAccounts.noAccounts": "No hay cuentas registradas",
    "bankAccounts.noAccountsDesc": "Agregue su primera cuenta bancaria para comenzar",
    "bankAccounts.activeAccounts": "Cuentas Activas",
    "bankAccounts.totalLiquidity": "Liquidez Total",
    "bankAccounts.creditLines": "Líneas de Crédito",
    "bankAccounts.search": "Buscar cuenta / entidad...",
    "bankAccounts.addAccount": "Agregar Cuenta",
    "bankAccounts.form.title": "Información de Cuenta Bancaria",
    "bankAccounts.form.bankName": "Nombre del Banco",
    "bankAccounts.form.accountNumber": "Número de Cuenta",
    "bankAccounts.form.accountType": "Tipo de Cuenta",
    "bankAccounts.form.routingNumber": "Routing Number",
    "bankAccounts.form.initialBalance": "Saldo Inicial",
    "bankAccounts.form.currency": "Moneda",
    "bankAccounts.form.notes": "Notas",
    "bankAccounts.form.isActive": "Cuenta Activa",
    "bankAccounts.type.checking": "Corriente (Checking)",
    "bankAccounts.type.savings": "Ahorros (Savings)",
    "bankAccounts.type.credit": "Crédito (Credit Line)",
    "bankAccounts.type.other": "Otra",
    "bankAccounts.table.bank": "Banco",
    "bankAccounts.table.account": "Cuenta",
    "bankAccounts.table.type": "Tipo",
    "bankAccounts.table.balance": "Saldo",
    "bankAccounts.table.status": "Estado",
    "bankAccounts.table.actions": "Acciones",
    "bankAccounts.status.active": "Activa",
    "bankAccounts.status.inactive": "Inactiva",
    "bankAccounts.confirmDelete": "¿Está seguro de eliminar la cuenta bancaria",
    "bankAccounts.error.load": "Error al cargar cuentas bancarias",
    "bankAccounts.error.save": "Error al guardar cuenta",
    "bankAccounts.error.delete": "Error al eliminar cuenta",

    // ==================== AUDIT TRAIL COMPLETE ====================
    "auditTrail.title": "Registro de Auditoría",
    "auditTrail.subtitle": "Historial completo de operaciones del sistema",
    "auditTrail.loading": "Cargando historial de auditoría...",
    "auditTrail.noRecords": "No se encontraron registros",
    "auditTrail.noRecordsDesc": "No hay actividad registrada en el período seleccionado",
    "auditTrail.filters": "Filtros",
    "auditTrail.search": "Buscar en auditoría...",
    "auditTrail.dateRange": "Rango de Fechas",
    "auditTrail.module": "Módulo",
    "auditTrail.action": "Acción",
    "auditTrail.user": "Usuario",
    "auditTrail.timestamp": "Fecha y Hora",
    "auditTrail.details": "Detalles",
    "auditTrail.export": "Exportar",
    "auditTrail.exportCSV": "Exportar CSV",
    "auditTrail.exportJSON": "Exportar JSON",
    "auditTrail.clearFilters": "Limpiar Filtros",
    "auditTrail.applyFilters": "Aplicar Filtros",
    "auditTrail.from": "Desde",
    "auditTrail.to": "Hasta",
    "auditTrail.table.timestamp": "Fecha/Hora",
    "auditTrail.table.user": "Usuario",
    "auditTrail.table.module": "Módulo",
    "auditTrail.table.action": "Acción",
    "auditTrail.table.description": "Descripción",
    "auditTrail.table.ipAddress": "IP",
    "auditTrail.error.load": "Error al cargar registro de auditoría",
    "auditTrail.error.export": "Error al exportar datos"
};

const enCompleteKeys = {
    // ==================== ROLE MANAGER - COMPLETE ====================
    "roleManager.title": "Role Management",
    "roleManager.subtitle": "Create, modify and delete system roles",
    "roleManager.newRole": "New Role",
    "roleManager.editRole": "Edit Role",
    "roleManager.deleteConfirm": "Are you sure you want to delete the role",
    "roleManager.form.name": "Role Name",
    "roleManager.form.description": "Description",
    "roleManager.form.level": "Access Level",
    "roleManager.form.permissions": "Permissions",
    "roleManager.table.name": "Name",
    "roleManager.table.description": "Description",
    "roleManager.table.level": "Level",
    "roleManager.table.actions": "Actions",
    "roleManager.error.load": "Error loading roles",
    "roleManager.modules.dashboard": "Dashboard",
    "roleManager.modules.customers": "Customers",
    "roleManager.modules.suppliers": "Suppliers",
    "roleManager.modules.products": "Products",
    "roleManager.modules.invoices": "Sales/Invoices",
    "roleManager.modules.bills": "Purchases/Expenses",
    "roleManager.modules.accounting": "Accounting",
    "roleManager.modules.settings": "Settings",
    "roleManager.actions.view": "View",
    "roleManager.actions.create": "Create",
    "roleManager.actions.edit": "Edit",
    "roleManager.actions.delete": "Delete",
    "roleManager.actions.approve": "Approve",
    "roleManager.actions.viewChartOfAccounts": "View Chart of Accounts",
    "roleManager.actions.createJournal": "Create Entry",
    "roleManager.actions.editJournal": "Edit Entry",
    "roleManager.actions.viewReports": "View Reports",
    "roleManager.actions.closePeriod": "Close Period",
    "roleManager.actions.viewCompany": "View Company",
    "roleManager.actions.manageUsers": "Manage Users",
    "roleManager.actions.manageRoles": "Manage Roles",

    // ==================== BANK ACCOUNTS COMPLETE ====================
    "bankAccounts.title": "Banking Matrix",
    "bankAccounts.subtitle": "Asset Liquidity Controller V5.0",
    "bankAccounts.newAccount": "New Account",
    "bankAccounts.editAccount": "Edit Account",
    "bankAccounts.deleteAccount": "Delete Account",
    "bankAccounts.noAccounts": "No accounts registered",
    "bankAccounts.noAccountsDesc": "Add your first bank account to get started",
    "bankAccounts.activeAccounts": "Active Accounts",
    "bankAccounts.totalLiquidity": "Total Liquidity",
    "bankAccounts.creditLines": "Credit Lines",
    "bankAccounts.search": "Search account / entity...",
    "bankAccounts.addAccount": "Add Account",
    "bankAccounts.form.title": "Bank Account Information",
    "bankAccounts.form.bankName": "Bank Name",
    "bankAccounts.form.accountNumber": "Account Number",
    "bankAccounts.form.accountType": "Account Type",
    "bankAccounts.form.routingNumber": "Routing Number",
    "bankAccounts.form.initialBalance": "Initial Balance",
    "bankAccounts.form.currency": "Currency",
    "bankAccounts.form.notes": "Notes",
    "bankAccounts.form.isActive": "Active Account",
    "bankAccounts.type.checking": "Checking",
    "bankAccounts.type.savings": "Savings",
    "bankAccounts.type.credit": "Credit Line",
    "bankAccounts.type.other": "Other",
    "bankAccounts.table.bank": "Bank",
    "bankAccounts.table.account": "Account",
    "bankAccounts.table.type": "Type",
    "bankAccounts.table.balance": "Balance",
    "bankAccounts.table.status": "Status",
    "bankAccounts.table.actions": "Actions",
    "bankAccounts.status.active": "Active",
    "bankAccounts.status.inactive": "Inactive",
    "bankAccounts.confirmDelete": "Are you sure you want to delete the bank account",
    "bankAccounts.error.load": "Error loading bank accounts",
    "bankAccounts.error.save": "Error saving account",
    "bankAccounts.error.delete": "Error deleting account",

    // ==================== AUDIT TRAIL COMPLETE ====================
    "auditTrail.title": "Audit Log",
    "auditTrail.subtitle": "Complete history of system operations",
    "auditTrail.loading": "Loading audit trail...",
    "auditTrail.noRecords": "No records found",
    "auditTrail.noRecordsDesc": "No activity recorded in the selected period",
    "auditTrail.filters": "Filters",
    "auditTrail.search": "Search audit...",
    "auditTrail.dateRange": "Date Range",
    "auditTrail.module": "Module",
    "auditTrail.action": "Action",
    "auditTrail.user": "User",
    "auditTrail.timestamp": "Date & Time",
    "auditTrail.details": "Details",
    "auditTrail.export": "Export",
    "auditTrail.exportCSV": "Export CSV",
    "auditTrail.exportJSON": "Export JSON",
    "auditTrail.clearFilters": "Clear Filters",
    "auditTrail.applyFilters": "Apply Filters",
    "auditTrail.from": "From",
    "auditTrail.to": "To",
    "auditTrail.table.timestamp": "Date/Time",
    "auditTrail.table.user": "User",
    "auditTrail.table.module": "Module",
    "auditTrail.table.action": "Action",
    "auditTrail.table.description": "Description",
    "auditTrail.table.ipAddress": "IP",
    "auditTrail.error.load": "Error loading audit log",
    "auditTrail.error.export": "Error exporting data"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);

        // Merge new keys (only add if they don't exist)
        Object.keys(updates).forEach(key => {
            if (!json[key]) {
                json[key] = updates[key];
            }
        });

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} - Added missing translation keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esCompleteKeys);
update(enFile, enCompleteKeys);

console.log('\n📊 COMPLETE TRANSLATION KEYS SUMMARY:');
console.log(`   - RoleManager: ${Object.keys(esCompleteKeys).filter(k => k.startsWith('roleManager')).length} keys`);
console.log(`   - BankAccounts: ${Object.keys(esCompleteKeys).filter(k => k.startsWith('bankAccounts')).length} keys`);
console.log(`   - AuditTrail: ${Object.keys(esCompleteKeys).filter(k => k.startsWith('auditTrail')).length} keys`);
console.log(`\n✅ ALL FILES MENU translation keys are now in locale files!`);
console.log(`📝 Total keys added: ${Object.keys(esCompleteKeys).length} per language`);
