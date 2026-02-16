/**
 * Suppliers Module Translation Keys
 * Components: SupplierList, SupplierForm, SupplierDetailView
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // SupplierList - Header
    "supplierList.title": "Matriz de Aliados",
    "supplierList.subtitle": "Supply Chain Intelligence Matrix",
    "supplierList.searchPlaceholder": "BUSCAR ALIADO / SKU...",
    "supplierList.filter.allZones": "TODAS LAS ZONAS",
    "supplierList.button.register": "Registrar Aliado",

    // SupplierList - Empty state
    "supplierList.empty.title": "Suministro no Detectado",
    "supplierList.empty.message": "No se han sincronizado proveedores bajo los parámetros de búsqueda actuales.",

    // SupplierList - Delete confirmation
    "supplierList.delete.confirm": "¿Estás seguro de que quieres eliminar a {name}?",

    // SupplierList - Date format
    "supplierList.date.invalid": "Fecha inválida",

    // SupplierList - Analytics footer
    "supplierList.analytics.title": "Sincronización de Red",
    "supplierList.analytics.subtitle": "Status global del pool de proveedores",
    "supplierList.analytics.totalAllies": "Total Aliados",
    "supplierList.analytics.linkPorts": "Puertos de Enlace",
    "supplierList.analytics.activeChannels": "Canales Activos",
    "supplierList.analytics.jurisZones": "Zonas Juris"
};

const enKeys = {
    // SupplierList - Header
    "supplierList.title": "Alliance Matrix",
    "supplierList.subtitle": "Supply Chain Intelligence Matrix",
    "supplierList.searchPlaceholder": "SEARCH ALLY / SKU...",
    "supplierList.filter.allZones": "ALL ZONES",
    "supplierList.button.register": "Register Ally",

    // SupplierList - Empty state
    "supplierList.empty.title": "Supply Not Detected",
    "supplierList.empty.message": "No suppliers have been synchronized under the current search parameters.",

    // SupplierList - Delete confirmation
    "supplierList.delete.confirm": "Are you sure you want to delete {name}?",

    // SupplierList - Date format
    "supplierList.date.invalid": "Invalid date",

    // SupplierList - Analytics footer
    "supplierList.analytics.title": "Network Synchronization",
    "supplierList.analytics.subtitle": "Global status of supplier pool",
    "supplierList.analytics.totalAllies": "Total Allies",
    "supplierList.analytics.linkPorts": "Link Ports",
    "supplierList.analytics.activeChannels": "Active Channels",
    "supplierList.analytics.jurisZones": "Juris Zones"
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

console.log('\n✅ SupplierList translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
