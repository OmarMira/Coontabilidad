
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ard.pendingToReconcile": "Pendiente por Conciliar",
    "ard.detectedInProcessedDocs": "Monto detectado en documentos procesados esperando cobro.",
    "ard.recoveredARD": "Recuperado (ARD)",
    "ard.fundsConvertedSuccess": "Total de fondos convertidos exitosamente desde el módulo ARD.",
    "ard.searchPlaceholder": "Buscar por documento o ID...",
    "ard.filteringPendingCollections": "Filtrando: Cobros Pendientes",
    "ard.originARD": "Origen ARD",
    "ard.ocrDetection": "Detección OCR",
    "ard.financialStatus": "Estado Financiero",
    "ard.collectedAndReconciled": "COBRADO Y CONCILIADO",
    "ard.pendingPayment": "PENDIENTE DE PAGO",
    "ard.registerCollection": "REGISTRAR COBRO",
    "ard.finalized": "Finalizado",
    "ard.docDate": "Fecha Doc: {date}",
    "ard.noItemsPendingCollection": "No hay ítems pendientes de cobro financiero"
};

const enUpdates = {
    "ard.pendingToReconcile": "Pending to Reconcile",
    "ard.detectedInProcessedDocs": "Amount detected in processed documents waiting for payment.",
    "ard.recoveredARD": "Recovered (ARD)",
    "ard.fundsConvertedSuccess": "Total funds successfully converted from the ARD module.",
    "ard.searchPlaceholder": "Search by document or ID...",
    "ard.filteringPendingCollections": "Filtering: Pending Collections",
    "ard.originARD": "ARD Origin",
    "ard.ocrDetection": "OCR Detection",
    "ard.financialStatus": "Financial Status",
    "ard.collectedAndReconciled": "COLLECTED AND RECONCILED",
    "ard.pendingPayment": "PENDING PAYMENT",
    "ard.registerCollection": "REGISTER COLLECTION",
    "ard.finalized": "Finalized",
    "ard.docDate": "Doc Date: {date}",
    "ard.noItemsPendingCollection": "No items pending financial collection"
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
