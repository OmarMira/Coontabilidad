
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ard.inventoryEnlace": "Enlace de Inventario ARD",
    "ard.inventorySubtitle": "Sincronice sus compras y ventas directamente con el stock físico.",
    "ard.syncStatus": "Sincronización",
    "ard.pendingSyncDocs": "{count} Pendientes",
    "ard.integrationNote": "Nota de Integración",
    "ard.integrationDesc": "Este módulo utiliza el motor de inteligencia de AccountExpress para detectar productos en sus documentos. Al sincronizar, el sistema ajustará automáticamente las cantidades en su almacén central.",
    "ard.detectedProductAI": "Producto Detectado (IA)",
    "ard.quantity": "Cantidad",
    "ard.syncingProgress": "Sincronizando...",
    "ard.syncStockBtn": "Sincronizar Existencias",
    "ard.selectInventoryProduct": "Seleccionar Producto del Inventario",
    "ard.noItemsToSync": "No hay productos pendientes de sincronización",
    "ard.inventoryUpdatedToast": "Inventario actualizado: +1 unidad.",
    "ard.syncErrorToast": "Error al sincronizar inventario",
    "ard.variousCharges": "Cargos Varios"
};

const enUpdates = {
    "ard.inventoryEnlace": "ARD Inventory Link",
    "ard.inventorySubtitle": "Sync your purchases and sales directly with physical stock.",
    "ard.syncStatus": "Synchronization",
    "ard.pendingSyncDocs": "{count} Pending",
    "ard.integrationNote": "Integration Note",
    "ard.integrationDesc": "This module uses the AccountExpress intelligence engine to detect products in your documents. Upon syncing, the system will automatically adjust the quantities in your central warehouse.",
    "ard.detectedProductAI": "Detected Product (AI)",
    "ard.quantity": "Quantity",
    "ard.syncingProgress": "Syncing...",
    "ard.syncStockBtn": "Sync Stock",
    "ard.selectInventoryProduct": "Select Inventory Product",
    "ard.noItemsToSync": "No products pending synchronization",
    "ard.inventoryUpdatedToast": "Inventory updated: +1 unit.",
    "ard.syncErrorToast": "Error syncing inventory",
    "ard.variousCharges": "Various Charges"
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
