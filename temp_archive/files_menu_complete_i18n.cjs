/**
 * MASSIVE I18N UPDATE - ALL FILES MENU COMPONENTS
 * This script creates a comprehensive translation system for all remaining components
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esComplete = {
    // ==================== ROLE MANAGER - MISSING KEYS ====================
    "roleManager.levelBadge": "Nivel",

    // ==================== BANK ACCOUNTS - ALL KEYS ====================
    "bankAccounts.title": "Matriz Bancaria",
    "bankAccounts.subtitle": "Asset Liquidity Controller V5.0",
    "bankAccounts.newAccount": "Nueva Cuenta",
    "bankAccounts.noAccounts": "No hay cuentas registradas",
    "bankAccounts.noAccountsDesc": "Agregue su primera cuenta bancaria",
    "bankAccounts.activeAccounts": "Cuentas Activas",
    "bankAccounts.totalLiquidity": "Liquidez Total",
    "bankAccounts.creditLines": "Líneas de Crédito",
    "bankAccounts.search": "Buscar cuenta / entidad...",
    "bankAccounts.addAccount": "Agregar Cuenta",

    // Form fields
    "bankAccounts.form.title": "Cuenta Bancaria",
    "bankAccounts.form.bankName": "Nombre del Banco",
    "bankAccounts.form.accountNumber": "Número de Cuenta",
    "bankAccounts.form.accountType": "Tipo de Cuenta",
    "bankAccounts.form.routing": "Routing Number",
    "bankAccounts.form.balance": "Saldo Inicial",
    "bankAccounts.form.currency": "Moneda",
    "bankAccounts.form.notes": "Notas",
    "bankAccounts.form.isActive": "Activa",

    // Account types  
    "bankAccounts.type.checking": "Corriente",
    "bankAccounts.type.savings": "Ahorros",
    "bankAccounts.type.credit": "Crédito",

    // Messages
    "bankAccounts.error.load": "Error al cargar cuentas bancarias",
    "bankAccounts.error.save": "Error al guardar cuenta",
    "bankAccounts.error.delete": "Error al eliminar cuenta",
    "bankAccounts.confirmDelete": "¿Eliminar la cuenta",

    // ==================== AUDIT TRAIL - ALL KEYS ====================
    "auditTrail.title": "Registro de Auditoría",
    "auditTrail.subtitle": "Historial completo de operaciones del sistema",
    "auditTrail.loading": "Cargando historial...",
    "auditTrail.noRecords": "No se encontraron registros",
    "auditTrail.filters": "Filtros",
    "auditTrail.search": "Buscar en auditoría...",
    "auditTrail.dateRange": "Rango de Fechas",
    "auditTrail.module": "Módulo",
    "auditTrail.action": "Acción",
    "auditTrail.user": "Usuario",
    "auditTrail.timestamp": "Fecha y Hora",
    "auditTrail.details": "Detalles",
    "auditTrail.export": "Exportar",
    "auditTrail.exportCSV": "Exportar a CSV",
    "auditTrail.exportJSON": "Exportar a JSON",
    "auditTrail.clearFilters": "Limpiar Filtros",
    "auditTrail.apply": "Aplicar",
    "auditTrail.from": "Desde",
    "auditTrail.to": "Hasta",

    // ==================== ADMIN USERS (Users & Security) - ALL KEYS ====================
    "adminUsers.title": "Usuarios y Seguridad",
    "adminUsers.subtitle": "Administración de usuarios del sistema",
    "adminUsers.newUser": "Nuevo Usuario",
    "adminUsers.noUsers": "No hay usuarios registrados",
    "adminUsers.noUsersDesc": "Cree el primer usuario del sistema",
    "adminUsers.activeUsers": "Usuarios Activos",
    "adminUsers.search": "Buscar usuario...",

    // Form
    "adminUsers.form.title": "Usuario del Sistema",
    "adminUsers.form.username": "Nombre de Usuario",
    "adminUsers.form.email": "Correo Electrónico",
    "adminUsers.form.password": "Contraseña",
    "adminUsers.form.confirmPassword": "Confirmar Contraseña",
    "adminUsers.form.role": "Rol",
    "adminUsers.form.isActive": "Activo",
    "adminUsers.form.firstName": "Nombre",
    "adminUsers.form.lastName": "Apellido",

    // Messages
    "adminUsers.error.load": "Error al cargar usuarios",
    "adminUsers.error.save": "Error al guardar usuario",
    "adminUsers.error.delete": "Error al eliminar usuario",
    "adminUsers.error.passwordMismatch": "Las contraseñas no coinciden",
    "adminUsers.confirmDelete": "¿Eliminar el usuario",

    // Table headers
    "adminUsers.table.name": "Nombre",
    "adminUsers.table.email": "Email",
    "adminUsers.table.role": "Rol",
    "adminUsers.table.status": "Estado",
    "adminUsers.table.lastLogin": "Último Acceso",
    "adminUsers.table.actions": "Acciones"
};

const enComplete = {
    // ==================== ROLE MANAGER - MISSING KEYS ====================
    "roleManager.levelBadge": "Level",

    // ==================== BANK ACCOUNTS - ALL KEYS ====================
    "bankAccounts.title": "Banking Matrix",
    "bankAccounts.subtitle": "Asset Liquidity Controller V5.0",
    "bankAccounts.newAccount": "New Account",
    "bankAccounts.noAccounts": "No accounts registered",
    "bankAccounts.noAccountsDesc": "Add your first bank account",
    "bankAccounts.activeAccounts": "Active Accounts",
    "bankAccounts.totalLiquidity": "Total Liquidity",
    "bankAccounts.creditLines": "Credit Lines",
    "bankAccounts.search": "Search account / entity...",
    "bankAccounts.addAccount": "Add Account",

    // Form fields
    "bankAccounts.form.title": "Bank Account",
    "bankAccounts.form.bankName": "Bank Name",
    "bankAccounts.form.accountNumber": "Account Number",
    "bankAccounts.form.accountType": "Account Type",
    "bankAccounts.form.routing": "Routing Number",
    "bankAccounts.form.balance": "Initial Balance",
    "bankAccounts.form.currency": "Currency",
    "bankAccounts.form.notes": "Notes",
    "bankAccounts.form.isActive": "Active",

    // Account types
    "bankAccounts.type.checking": "Checking",
    "bankAccounts.type.savings": "Savings",
    "bankAccounts.type.credit": "Credit",

    // Messages
    "bankAccounts.error.load": "Error loading bank accounts",
    "bankAccounts.error.save": "Error saving account",
    "bankAccounts.error.delete": "Error deleting account",
    "bankAccounts.confirmDelete": "Delete account",

    // ==================== AUDIT TRAIL - ALL KEYS ====================
    "auditTrail.title": "Audit Log",
    "auditTrail.subtitle": "Complete history of system operations",
    "auditTrail.loading": "Loading history...",
    "auditTrail.noRecords": "No records found",
    "auditTrail.filters": "Filters",
    "auditTrail.search": "Search audit...",
    "auditTrail.dateRange": "Date Range",
    "auditTrail.module": "Module",
    "auditTrail.action": "Action",
    "auditTrail.user": "User",
    "auditTrail.timestamp": "Date & Time",
    "auditTrail.details": "Details",
    "auditTrail.export": "Export",
    "auditTrail.exportCSV": "Export to CSV",
    "auditTrail.exportJSON": "Export to JSON",
    "auditTrail.clearFilters": "Clear Filters",
    "auditTrail.apply": "Apply",
    "auditTrail.from": "From",
    "auditTrail.to": "To",

    // ==================== ADMIN USERS (Users & Security) - ALL KEYS ====================
    "adminUsers.title": "Users & Security",
    "adminUsers.subtitle": "System user management",
    "adminUsers.newUser": "New User",
    "adminUsers.noUsers": "No users registered",
    "adminUsers.noUsersDesc": "Create the first system user",
    "adminUsers.activeUsers": "Active Users",
    "adminUsers.search": "Search user...",

    // Form
    "adminUsers.form.title": "System User",
    "adminUsers.form.username": "Username",
    "adminUsers.form.email": "Email Address",
    "adminUsers.form.password": "Password",
    "adminUsers.form.confirmPassword": "Confirm Password",
    "adminUsers.form.role": "Role",
    "adminUsers.form.isActive": "Active",
    "adminUsers.form.firstName": "First Name",
    "adminUsers.form.lastName": "Last Name",

    // Messages
    "adminUsers.error.load": "Error loading users",
    "adminUsers.error.save": "Error saving user",
    "adminUsers.error.delete": "Error deleting user",
    "adminUsers.error.passwordMismatch": "Passwords do not match",
    "adminUsers.confirmDelete": "Delete user",

    // Table headers
    "adminUsers.table.name": "Name",
    "adminUsers.table.email": "Email",
    "adminUsers.table.role": "Role",
    "adminUsers.table.status": "Status",
    "adminUsers.table.lastLogin": "Last Login",
    "adminUsers.table.actions": "Actions"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with ${Object.keys(updates).length} keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esComplete);
update(enFile, enComplete);

console.log(`\n📊 FILES MENU - Translation Keys Summary:`);
console.log(`   - PaymentMethods: 34 keys`);
console.log(`   - CompanyData: 40+ keys`);
console.log(`   - RoleManager: 30+ keys (existing + 1 new)`);
console.log(`   - BankAccounts: ${Object.keys(esComplete).filter(k => k.startsWith('bankAccounts')).length} keys`);
console.log(`   - AuditTrail: ${Object.keys(esComplete).filter(k => k.startsWith('auditTrail')).length} keys`);
console.log(`   - AdminUsers: ${Object.keys(esComplete).filter(k => k.startsWith('adminUsers')).length} keys`);
console.log(`\n✅ ALL translation keys for Files menu have been added!`);
console.log(`📝 Next: Update the actual .tsx component files to use t() function`);
