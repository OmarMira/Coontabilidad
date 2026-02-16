
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "customerList.title": "Panel de Clientes",
    "customerList.subtitle": "Gestión de Relaciones y Actividad Comercial",
    "customerList.searchPlaceholder": "Buscar por nombre, email o teléfono...",
    "customerList.allCounties": "Todos los Condados",
    "customerList.registerCustomer": "Registrar Cliente",
    "customerList.emptyTitle": "Cartera Vacía",
    "customerList.emptyMessage": "No se encontraron clientes con los filtros actuales o la base de datos está vacía.",
    "customerList.networkSync": "Sincronización de Red",
    "customerList.currentStatus": "Estado actual de la cartera de clientes",
    "customerList.totalRecords": "Registros Totales",
    "customerList.validatedContacts": "Contactos Validados",
    "customerList.activeLines": "Líneas Activas",
    "customerList.geoZones": "Zonas Geo",
    "customerList.confirmDelete": "¿Desea eliminar a {name}? Esta acción no se puede deshacer.",
    "customerList.invalidDate": "Fecha inválida"
};

const enUpdates = {
    "customerList.title": "Customer Panel",
    "customerList.subtitle": "Relationship Management and Commercial Activity",
    "customerList.searchPlaceholder": "Search by name, email or phone...",
    "customerList.allCounties": "All Counties",
    "customerList.registerCustomer": "Register Customer",
    "customerList.emptyTitle": "Empty Portfolio",
    "customerList.emptyMessage": "No customers found with the current filters or the database is empty.",
    "customerList.networkSync": "Network Sync",
    "customerList.currentStatus": "Current status of the customer portfolio",
    "customerList.totalRecords": "Total Records",
    "customerList.validatedContacts": "Validated Contacts",
    "customerList.activeLines": "Active Lines",
    "customerList.geoZones": "Geo Zones",
    "customerList.confirmDelete": "Are you sure you want to delete {name}? This action cannot be undone.",
    "customerList.invalidDate": "Invalid date"
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
