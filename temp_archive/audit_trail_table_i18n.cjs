/**
 * AuditTrailTable.tsx - Complete translation keys
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // Page header
    "auditTrailTable.title": "Trazabilidad",
    "auditTrailTable.subtitle": "Historial de cambios y acceso al sistema",

    // Filter labels
    "auditTrailTable.filter.entity": "Entidad",
    "auditTrailTable.filter.action": "Acción",

    // Filter options - Entities
    "auditTrailTable.entity.all": "Todas las Entidades",
    "auditTrailTable.entity.customer": "Clientes",
    "auditTrailTable.entity.invoice": "Facturas",
    "auditTrailTable.entity.bill": "Ventas",
    "auditTrailTable.entity.product": "Productos",
    "auditTrailTable.entity.account": "Plan de Cuentas",
    "auditTrailTable.entity.journal": "Asientos",
    "auditTrailTable.entity.user": "Usuarios",

    // Filter options - Actions
    "auditTrailTable.action.all": "Todas las Acciones",
    "auditTrailTable.action.create": "Creación",
    "auditTrailTable.action.update": "Modificación",
    "auditTrailTable.action.delete": "Eliminación",
    "auditTrailTable.action.login": "Inicio Sesión",
    "auditTrailTable.action.logout": "Cierre Sesión",

    // Button
    "auditTrailTable.button.refresh": "Actualizar",

    // Table headers
    "auditTrailTable.table.datetime": "Fecha/Hora",
    "auditTrailTable.table.user": "Usuario",
    "auditTrailTable.table.action": "Acción",
    "auditTrailTable.table.entity": "Entidad",
    "auditTrailTable.table.details": "Detalles",

    // Table content
    "auditTrailTable.table.userId": "Usuario #{id}",

    // Loading/Empty states
    "auditTrailTable.loading": "Cargando trazabilidad...",
    "auditTrailTable.empty": "No se encontraron registros de auditoría"
};

const enKeys = {
    // Page header
    "auditTrailTable.title": "Traceability",
    "auditTrailTable.subtitle": "Change history and system access",

    // Filter labels
    "auditTrailTable.filter.entity": "Entity",
    "auditTrailTable.filter.action": "Action",

    // Filter options - Entities
    "auditTrailTable.entity.all": "All Entities",
    "auditTrailTable.entity.customer": "Customers",
    "auditTrailTable.entity.invoice": "Invoices",
    "auditTrailTable.entity.bill": "Sales",
    "auditTrailTable.entity.product": "Products",
    "auditTrailTable.entity.account": "Chart of Accounts",
    "auditTrailTable.entity.journal": "Journal Entries",
    "auditTrailTable.entity.user": "Users",

    // Filter options - Actions
    "auditTrailTable.action.all": "All Actions",
    "auditTrailTable.action.create": "Creation",
    "auditTrailTable.action.update": "Modification",
    "auditTrailTable.action.delete": "Deletion",
    "auditTrailTable.action.login": "Login",
    "auditTrailTable.action.logout": "Logout",

    // Button
    "auditTrailTable.button.refresh": "Refresh",

    // Table headers
    "auditTrailTable.table.datetime": "Date/Time",
    "auditTrailTable.table.user": "User",
    "auditTrailTable.table.action": "Action",
    "auditTrailTable.table.entity": "Entity",
    "auditTrailTable.table.details": "Details",

    // Table content
    "auditTrailTable.table.userId": "User #{id}",

    // Loading/Empty states
    "auditTrailTable.loading": "Loading traceability...",
    "auditTrailTable.empty": "No audit records found"
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

console.log('\n✅ AuditTrailTable translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
