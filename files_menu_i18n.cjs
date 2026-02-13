
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    // ==================== MENÚ ARCHIVOS - NAVEGACIÓN ====================
    "navigation.archive": "Arch ivos",
    "navigation.companyData": "Datos de la Empresa",
    "navigation.usersSecurity": "Usuarios y Seguridad",
    "navigation.roleManager": "Gestión de Roles",
    "navigation.auditTrail": "Auditoría del Sistema",
    "navigation.bankAccounts": "Cuentas Bancarias",
    "navigation.paymentMethods": "Métodos de Pago",

    // ==================== COMPANY DATA (Datos de la Empresa) ====================
    "companyData.title": "Datos Corporativos",
    "companyData.subtitle": "Configuración de la entidad titular del sistema",
    "companyData.loading": "Cargando Estructura Corporativa...",
    "companyData.error": "Error Crítico",
    "companyData.saveButton": "Guardar Cambios",
    "companyData.saving": "Procesando...",

    // Tabs
    "companyData.tab.company": "Estructura Legal",
    "companyData.tab.finance": "Parámetros Financieros",
    "companyData.tab.users": "Acceso y Seguridad",

    // Alert
    "companyData.alert.title": "Entidad con Operaciones Activas",
    "companyData.alert.description": "Se detectaron registros contables asociados. La modificación de campos fiscales afectará la integridad histórica de los reportes.",
    "companyData.alert.customers": "Clientes",
    "companyData.alert.suppliers": "Aliados",
    "companyData.alert.invoices": "Facturas",
    "companyData.alert.bills": "Compras",

    // Company tab
    "companyData.visual.title": "Identidad Visual",
    "companyData.cloud.title": "Cloud Vault™ (Backup)",
    "companyData.cloud.linked": "Sincronización Activa",
    "companyData.cloud.notLinked": "Sin Respaldo Nube",
    "companyData.cloud.linkedDesc": "Sus datos se cifran y respaldan automáticamente en su Google Drive privado.",
    "companyData.cloud.notLinkedDesc": "Conecte su cuenta para activar el respaldo híbrido automático y proteger su información.",
    "companyData.cloud.disconnect": "Desvincular Cuenta",
    "companyData.cloud.connect": "Conectar Google Drive",
    "companyData.cloud.confirmDisconnect": "¿Desea desvincular Google Drive? Las copias de seguridad automáticas se detendrán.",

    // Fields
    "companyData.field.companyName": "Nombre Comercial",
    "companyData.field.legalName": "Razón Social",
    "companyData.field.taxId": "ID Fiscal",
    "companyData.field.address": "Dirección Física",
    "companyData.field.city": "Ciudad",
    "companyData.field.state": "Estado",
    "companyData.field.zipCode": "ZIP / Postal",
    "companyData.field.phone": "Teléfono",
    "companyData.field.email": "Email",

    // Finance tab
    "companyData.finance.sales": "Ventas & Distribución",
    "companyData.finance.salesDesc": "Reglas globales",
    "companyData.finance.commission": "Comisión %",
    "companyData.finance.shipping": "Tarifa Envío $",
    "companyData.finance.accounting": "Contabilidad",
    "companyData.finance.accountingDesc": "Libro mayor",
    "companyData.finance.lateFee": "Mora %",
    "companyData.finance.gracePeriod": "Gracia (Días)",

    // Users tab
    "companyData.users.title": "Modalidad Single-User",
    "companyData.users.description": "El sistema está configurado en modo local mono-usuario. La gestión de roles adicionales está inhabilitada en está versión.",
    "companyData.users.currentProfile": "Perfil Actual",
    "companyData.users.profileName": "Root Administrator",
    "companyData.users.permissions": "Permisos",
    "companyData.users.access": "Total Control (R/W)",

    // Warning modal
    "companyData.warning.title": "¡Cambio Crítico!",
    "companyData.warning.description": "Está modificando identificadores fiscales con registros contables activos.",
    "companyData.warning.proceed": "Proceder (Riesgos Conocidos)",
    "companyData.warning.cancel": "Cancelar",

    // ==================== ROLE MANAGER (Gestión de Roles) ====================
    "roleManager.title": "Gestión de Roles",
    "roleManager.subtitle": "Crear, modificar y eliminar roles del sistema",
    "roleManager.newRole": "Nuevo Rol",
    "roleManager.noRoles": "No hay roles creados",
    "roleManager.noRolesDesc": "Crea tu primer rol personalizado",

    // Table headers
    "roleManager.table.name": "Nombre",
    "roleManager.table.description": "Descripción",
    "roleManager.table.level": "Nivel",
    "roleManager.table.actions": "Acciones",

    // Form
    "roleManager.form.titleNew": "Nuevo Rol",
    "roleManager.form.titleEdit": "Editar Rol",
    "roleManager.form.name": "Nombre del Rol",
    "roleManager.form.namePlaceholder": "ej: manager, supervisor",
    "roleManager.form.description": "Descripción",
    "roleManager.form.descriptionPlaceholder": "Descripción del rol",
    "roleManager.form.level": "Nivel de Acceso (0-100)",
    "roleManager.form.levelHelp": "0-10: Solo lectura | 11-50: Usuario estándar | 51-99: Avanzado | 100: Administrador",
    "roleManager.form.permissions": "Permisos del Sistema",
    "roleManager.form.cancel": "Cancelar",
    "roleManager.form.create": "Crear Rol",
    "roleManager.form.update": "Actualizar",

    // Modules
    "roleManager.module.dashboard": "Dashboard",
    "roleManager.module.customers": "Clientes",
    "roleManager.module.suppliers": "Proveedores",
    "roleManager.module.products": "Productos",
    "roleManager.module.invoices": "Ventas/Facturas",
    "roleManager.module.bills": "Compras/Gastos",
    "roleManager.module.accounting": "Contabilidad",
    "roleManager.module.settings": "Configuración",

    // Actions
    "roleManager.action.view": "Ver",
    "roleManager.action.create": "Crear",
    "roleManager.action.edit": "Editar",
    "roleManager.action.delete": "Eliminar",
    "roleManager.action.approve": "Aprobar",
    "roleManager.action.viewChartAccounts": "Ver Plan Ctas",
    "roleManager.action.createJournal": "Crear Asiento",
    "roleManager.action.editJournal": "Editar Asiento",
    "roleManager.action.viewReports": "Ver Reportes",
    "roleManager.action.closePeriod": "Cierre Periodo",
    "roleManager.action.viewCompany": "Ver Empresa",
    "roleManager.action.manageUsers": "Usuarios",
    "roleManager.action.manageRoles": "Roles",

    // Messages
    "roleManager.error.load": "Error al cargar roles",
    "roleManager.confirmDelete": "¿Está seguro de eliminar el rol",

    // ==================== AUDIT TRAIL (Auditoría del Sistema) ====================
    "auditTrail.title": "Auditoría del Sistema",
    "auditTrail.subtitle": "Registro completo de todas las operaciones del sistema",
    "auditTrail.loading": "Cargando historial de auditoría...",
    "auditTrail.noRecords": "No se encontraron registros de auditoría",
    "auditTrail.filters": "Filtros",
    "auditTrail.search": "Buscar en auditoría...",
    "auditTrail.dateRange": "Rango de Fechas",
    "auditTrail.module": "Módulo",
    "auditTrail.action": "Acción",
    "auditTrail.user": "Usuario",
    "auditTrail.timestamp": "Fecha y Hora",
    "auditTrail.details": "Detalles",
    "auditTrail.export": "Exportar",

    // ==================== BANK ACCOUNTS (Cuentas Bancarias) ====================
    "bankAccounts.title": "Cuentas Bancarias",
    "bankAccounts.subtitle": "Administración de cuentas bancarias de la empresa",
    "bankAccounts.newAccount": "Nueva Cuenta",
    "bankAccounts.noAccounts": "No hay cuentas bancarias registradas",
    "bankAccounts.noAccountsDesc": "Agrega tu primera cuenta bancaria",

    // Form
    "bankAccounts.form.title": "Cuenta Bancaria",
    "bankAccounts.form.bank Name": "Nombre del Banco",
    "bankAccounts.form.accountNumber": "Número de Cuenta",
    "bankAccounts.form.accountType": "Tipo de Cuenta",
    "bankAccounts.form.routing": "Routing Number",
    "bankAccounts.form.balance": "Saldo Inicial",
    "bankAccounts.form.currency": "Moneda",
    "bankAccounts.form.notes": "Notas",

    // Account types
    "bankAccounts.type.checking": "Cuenta Corriente",
    "bankAccounts.type.savings": "Cuenta de Ahorros",
    "bankAccounts.type.credit": "Línea de Crédito",

    // Table
    "bankAccounts.table.bank": "Banco",
    "bankAccounts.table.account": "Cuenta",
    "bankAccounts.table.type": "Tipo",
    "bankAccounts.table.balance": "Saldo",
    "bankAccounts.table.status": "Estado",
    "bankAccounts.table.actions": "Acciones",

    // ==================== PAYMENT METHODS (Métodos de Pago) ====================
    "paymentMethodsPage.title": "Métodos de Pago",
    "paymentMethodsPage.subtitle": "Configuración de los métodos de pago aceptados",
    "paymentMethodsPage.newMethod": "Nuevo Método",
    "paymentMethodsPage.noMethods": "No hay métodos de pago configurados",
    "paymentMethodsPage.noMethodsDesc": "Configura los métodos de pago que aceptas",

    // Form
    "paymentMethodsPage.form.title": "Método de Pago",
    "paymentMethodsPage.form.name": "Nombre",
    "paymentMethodsPage.form.description": "Descripción",
    "paymentMethodsPage.form.enabled": "Habilitado",
    "paymentMethodsPage.form.requiresReference": "Requiere Referencia",
    "paymentMethodsPage.form.accountRequired": "Requiere Cuenta Bancaria",

    // Table
    "paymentMethodsPage.table.name": "Método",
    "paymentMethodsPage.table.description": "Descripción",
    "paymentMethodsPage.table.status": "Estado",
    "paymentMethodsPage.table.actions": "Acciones"
};

const enUpdates = {
    // ==================== FILES MENU - NAVIGATION ====================
    "navigation.archive": "Files",
    "navigation.companyData": "Company Data",
    "navigation.usersSecurity": "Users & Security",
    "navigation.roleManager": "Role Manager",
    "navigation.auditTrail": "System Audit",
    "navigation.bankAccounts": "Bank Accounts",
    "navigation.paymentMethods": "Payment Methods",

    // ==================== COMPANY DATA ====================
    "companyData.title": "Corporate Data",
    "companyData.subtitle": "Configuration of the system's legal entity",
    "companyData.loading": "Loading Corporate Structure...",
    "companyData.error": "Critical Error",
    "companyData.saveButton": "Save Changes",
    "companyData.saving": "Processing...",

    // Tabs
    "companyData.tab.company": "Legal Structure",
    "companyData.tab.finance": "Financial Parameters",
    "companyData.tab.users": "Access & Security",

    // Alert
    "companyData.alert.title": "Entity with Active Operations",
    "companyData.alert.description": "Associated accounting records detected. Modifying tax fields will affect the historical integrity of reports.",
    "companyData.alert.customers": "Customers",
    "companyData.alert.suppliers": "Partners",
    "companyData.alert.invoices": "Invoices",
    "companyData.alert.bills": "Purchases",

    // Company tab
    "companyData.visual.title": "Visual Identity",
    "companyData.cloud.title": "Cloud Vault™ (Backup)",
    "companyData.cloud.linked": "Active Sync",
    "companyData.cloud.notLinked": "No Cloud Backup",
    "companyData.cloud.linkedDesc": "Your data is encrypted and automatically backed up to your private Google Drive.",
    "companyData.cloud.notLinkedDesc": "Connect your account to enable automatic hybrid backup and protect your information.",
    "companyData.cloud.disconnect": "Disconnect Account",
    "companyData.cloud.connect": "Connect Google Drive",
    "companyData.cloud.confirmDisconnect": "Disconnect Google Drive? Automatic backups will stop.",

    // Fields
    "companyData.field.companyName": "Trade Name",
    "companyData.field.legalName": "Legal Name",
    "companyData.field.taxId": "Tax ID",
    "companyData.field.address": "Physical Address",
    "companyData.field.city": "City",
    "companyData.field.state": "State",
    "companyData.field.zipCode": "ZIP Code",
    "companyData.field.phone": "Phone",
    "companyData.field.email": "Email",

    // Finance tab
    "companyData.finance.sales": "Sales & Distribution",
    "companyData.finance.salesDesc": "Global rules",
    "companyData.finance.commission": "Commission %",
    "companyData.finance.shipping": "Shipping Rate $",
    "companyData.finance.accounting": "Accounting",
    "companyData.finance.accountingDesc": "General ledger",
    "companyData.finance.lateFee": "Late Fee %",
    "companyData.finance.gracePeriod": "Grace Period (Days)",

    // Users tab
    "companyData.users.title": "Single-User Mode",
    "companyData.users.description": "The system is configured in single-user local mode. Additional role management is disabled in this version.",
    "companyData.users.currentProfile": "Current Profile",
    "companyData.users.profileName": "Root Administrator",
    "companyData.users.permissions": "Permissions",
    "companyData.users.access": "Full Control (R/W)",

    // Warning modal
    "companyData.warning.title": "Critical Change!",
    "companyData.warning.description": "You are modifying tax identifiers with active accounting records.",
    "companyData.warning.proceed": "Proceed (Risks Acknowledged)",
    "companyData.warning.cancel": "Cancel",

    // ==================== ROLE MANAGER ====================
    "roleManager.title": "Role Management",
    "roleManager.subtitle": "Create, modify and delete system roles",
    "roleManager.newRole": "New Role",
    "roleManager.noRoles": "No roles created",
    "roleManager.noRolesDesc": "Create your first custom role",

    // Table headers
    "roleManager.table.name": "Name",
    "roleManager.table.description": "Description",
    "roleManager.table.level": "Level",
    "roleManager.table.actions": "Actions",

    // Form
    "roleManager.form.titleNew": "New Role",
    "roleManager.form.titleEdit": "Edit Role",
    "roleManager.form.name": "Role Name",
    "roleManager.form.namePlaceholder": "e.g: manager, supervisor",
    "roleManager.form.description": "Description",
    "roleManager.form.descriptionPlaceholder": "Role description",
    "roleManager.form.level": "Access Level (0-100)",
    "roleManager.form.levelHelp": "0-10: Read-only | 11-50: Standard user | 51-99: Advanced | 100: Administrator",
    "roleManager.form.permissions": "System Permissions",
    "roleManager.form.cancel": "Cancel",
    "roleManager.form.create": "Create Role",
    "roleManager.form.update": "Update",

    // Modules
    "roleManager.module.dashboard": "Dashboard",
    "roleManager.module.customers": "Customers",
    "roleManager.module.suppliers": "Suppliers",
    "roleManager.module.products": "Products",
    "roleManager.module.invoices": "Sales/Invoices",
    "roleManager.module.bills": "Purchases/Expenses",
    "roleManager.module.accounting": "Accounting",
    "roleManager.module.settings": "Settings",

    // Actions
    "roleManager.action.view": "View",
    "roleManager.action.create": "Create",
    "roleManager.action.edit": "Edit",
    "roleManager.action.delete": "Delete",
    "roleManager.action.approve": "Approve",
    "roleManager.action.viewChartAccounts": "View Chart Accts",
    "roleManager.action.createJournal": "Create Entry",
    "roleManager.action.editJournal": "Edit Entry",
    "roleManager.action.viewReports": "View Reports",
    "roleManager.action.closePeriod": "Close Period",
    "roleManager.action.viewCompany": "View Company",
    "roleManager.action.manageUsers": "Users",
    "roleManager.action.manageRoles": "Roles",

    // Messages
    "roleManager.error.load": "Error loading roles",
    "roleManager.confirmDelete": "Are you sure you want to delete the role",

    // ==================== AUDIT TRAIL ====================
    "auditTrail.title": "System Audit",
    "auditTrail.subtitle": "Complete record of all system operations",
    "auditTrail.loading": "Loading audit history...",
    "auditTrail.noRecords": "No audit records found",
    "auditTrail.filters": "Filters",
    "auditTrail.search": "Search audit...",
    "auditTrail.dateRange": "Date Range",
    "auditTrail.module": "Module",
    "auditTrail.action": "Action",
    "auditTrail.user": "User",
    "auditTrail.timestamp": "Date & Time",
    "auditTrail.details": "Details",
    "auditTrail.export": "Export",

    // ==================== BANK ACCOUNTS ====================
    "bankAccounts.title": "Bank Accounts",
    "bankAccounts.subtitle": "Management of company bank accounts",
    "bankAccounts.newAccount": "New Account",
    "bankAccounts.noAccounts": "No bank accounts registered",
    "bankAccounts.noAccountsDesc": "Add your first bank account",

    // Form
    "bankAccounts.form.title": "Bank Account",
    "bankAccounts.form.bankName": "Bank Name",
    "bankAccounts.form.accountNumber": "Account Number",
    "bankAccounts.form.accountType": "Account Type",
    "bankAccounts.form.routing": "Routing Number",
    "bankAccounts.form.balance": "Initial Balance",
    "bankAccounts.form.currency": "Currency",
    "bankAccounts.form.notes": "Notes",

    // Account types
    "bankAccounts.type.checking": "Checking Account",
    "bankAccounts.type.savings": "Savings Account",
    "bankAccounts.type.credit": "Credit Line",

    // Table
    "bankAccounts.table.bank": "Bank",
    "bankAccounts.table.account": "Account",
    "bankAccounts.table.type": "Type",
    "bankAccounts.table.balance": "Balance",
    "bankAccounts.table.status": "Status",
    "bankAccounts.table.actions": "Actions",

    // ==================== PAYMENT METHODS ====================
    "paymentMethodsPage.title": "Payment Methods",
    "paymentMethodsPage.subtitle": "Configuration of accepted payment methods",
    "paymentMethodsPage.newMethod": "New Method",
    "paymentMethodsPage.noMethods": "No payment methods configured",
    "paymentMethodsPage.noMethodsDesc": "Configure the payment methods you accept",

    // Form
    "paymentMethodsPage.form.title": "Payment Method",
    "paymentMethodsPage.form.name": "Name",
    "paymentMethodsPage.form.description": "Description",
    "paymentMethodsPage.form.enabled": "Enabled",
    "paymentMethodsPage.form.requiresReference": "Requires Reference",
    "paymentMethodsPage.form.accountRequired": "Requires Bank Account",

    // Table
    "paymentMethodsPage.table.name": "Method",
    "paymentMethodsPage.table.description": "Description",
    "paymentMethodsPage.table.status": "Status",
    "paymentMethodsPage.table.actions": "Actions"
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
