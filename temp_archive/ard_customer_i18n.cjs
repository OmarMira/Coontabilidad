
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ard.searchCustomerPlaceholder": "Buscar por cliente asignado...",
    "ard.activeARDCustomers": "Clientes Activos ARD",
    "ard.totalDocs": "Docs Totales",
    "ard.grossLiquidity": "Liquidez Bruta",
    "ard.pendingConversionTooltip": "Pendientes de Conversión",
    "ard.convertedTooltip": "Convertidos",
    "ard.viewDetails": "Ver Detalles",
    "ard.noLinkedCustomers": "No hay clientes vinculados a documentos ARD aún",
    "ard.assignCustomersGarHint": "Asigne clientes a sus escaneos en la pestaña GESTIÓN GAR"
};

const enUpdates = {
    "ard.searchCustomerPlaceholder": "Search by assigned customer...",
    "ard.activeARDCustomers": "Active ARD Customers",
    "ard.totalDocs": "Total Docs",
    "ard.grossLiquidity": "Gross Liquidity",
    "ard.pendingConversionTooltip": "Pending Conversion",
    "ard.convertedTooltip": "Converted",
    "ard.viewDetails": "View Details",
    "ard.noLinkedCustomers": "No customers linked to ARD documents yet",
    "ard.assignCustomersGarHint": "Assign customers to your scans in the GAR MANAGEMENT tab"
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
