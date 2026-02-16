/**
 * ACCOUNTS PAYABLE - BATCH TRANSLATION KEYS
 * Components: SupplierForm, BillList, BillForm, SupplierPayments, PurchaseOrders, PayableReports
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // === SupplierForm ===
    "supplierForm.info": "Información del Proveedor",
    "supplierForm.name": "Nombre del Proveedor",
    "supplierForm.namePlaceholder": "Ingresa nombre comercial",
    "supplierForm.businessName": "Razón Social",
    "supplierForm.businessNamePlaceholder": "Nombre registrado oficialmente",
    "supplierForm.documentType": "Tipo de Documento",
    "supplierForm.documentNumber": "Número de Documento",
    "supplierForm.documentNumberPlaceholder": "Ingresar número",
    "supplierForm.businessActivity": "Actividad Comercial",
    "supplierForm.businessActivityPlaceholder": "Ej: Distribuidor mayorista",
    "supplierForm.assignedBuyer": "Comprador Asignado",
    "supplierForm.status": "Estado del Proveedor",
    "supplierForm.notesPlaceholder": "Notas internas sobre el proveedor",
    "supplierForm.titleEdit": "Editar Proveedor",
    "supplierForm.titleNew": "Nuevo Proveedor",
    "supplierForm.updateSupplier": "Actualizar Proveedor",
    "supplierForm.createSupplier": "Crear Proveedor",

    // === BillList ===
    "billList.title": "Cuentas por Pagar",
    "billList.subtitle": "Matriz de Pasivos y Obligaciones",
    "billList.searchPlaceholder": "BUSCAR FACTURA / PROVEEDOR...",
    "billList.filter.allStatuses": "TODOS LOS ESTADOS",
    "billList.button.newObligation": "Nueva Obligación",
    "billList.empty.title": "No se detectan obligaciones",
    "billList.empty.message": "Pool de pasivos vacío para los criterios aplicados.",
    "billList.delete.confirm": "¿Estás seguro de que quieres eliminar la factura {billNumber}?",
    "billList.delete.paidWarning": "⚠️ No se pueden eliminar facturas con estatus PAGADA",

    // BillList - Status badges
    "billList.status.draft": "BORRADOR",
    "billList.status.received": "RECIBIDA",
    "billList.status.approved": "APROBADA",
    "billList.status.paid": "PAGADA",
    "billList.status.overdue": "VENCIDA",
    "billList.status.cancelled": "CANCELADA",

    // BillList - Card labels
    "billList.label.strategicAlly": "Aliado Estratégico",
    "billList.label.dueDate": "Vence:",
    "billList.label.issueDate": "Emitida:",
    "billList.label.financialLoad": "Carga Financiera",
    "billList.alert.overdue": "ALERTA CRÍTICA: Obligación vencida por {days} ciclos operativos",
    "billList.alert.overdueNoDate": "ALERTA CRÍTICA: Obligación vencida sin fecha definida",

    // BillList - Analytics
    "billList.analytics.title": "Malla de Pasivos",
    "billList.analytics.subtitle": "Monitoreo histórico de obligaciones",
    "billList.analytics.documents": "Documentos",
    "billList.analytics.totalVolume": "Volumen Total",
    "billList.analytics.settled": "Saldadas",
    "billList.analytics.pending": "Pendiente",
};

const enKeys = {
    // === SupplierForm ===
    "supplierForm.info": "Supplier Information",
    "supplierForm.name": "Supplier Name",
    "supplierForm.namePlaceholder": "Enter commercial name",
    "supplierForm.businessName": "Business Name",
    "supplierForm.businessNamePlaceholder": "Officially registered name",
    "supplierForm.documentType": "Document Type",
    "supplierForm.documentNumber": "Document Number",
    "supplierForm.documentNumberPlaceholder": "Enter number",
    "supplierForm.businessActivity": "Business Activity",
    "supplierForm.businessActivityPlaceholder": "e.g: Wholesale distributor",
    "supplierForm.assignedBuyer": "Assigned Buyer",
    "supplierForm.status": "Supplier Status",
    "supplierForm.notesPlaceholder": "Internal notes about supplier",
    "supplierForm.titleEdit": "Edit Supplier",
    "supplierForm.titleNew": "New Supplier",
    "supplierForm.updateSupplier": "Update Supplier",
    "supplierForm.createSupplier": "Create Supplier",

    // === BillList ===
    "billList.title": "Accounts Payable",
    "billList.subtitle": "Liabilities and Obligations Matrix",
    "billList.searchPlaceholder": "SEARCH BILL / SUPPLIER...",
    "billList.filter.allStatuses": "ALL STATUSES",
    "billList.button.newObligation": "New Obligation",
    "billList.empty.title": "No obligations detected",
    "billList.empty.message": "Empty liabilities pool for applied criteria.",
    "billList.delete.confirm": "Are you sure you want to delete bill {billNumber}?",
    "billList.delete.paidWarning": "⚠️ Cannot delete bills with PAID status",

    // BillList - Status badges
    "billList.status.draft": "DRAFT",
    "billList.status.received": "RECEIVED",
    "billList.status.approved": "APPROVED",
    "billList.status.paid": "PAID",
    "billList.status.overdue": "OVERDUE",
    "billList.status.cancelled": "CANCELLED",

    // BillList - Card labels
    "billList.label.strategicAlly": "Strategic Ally",
    "billList.label.dueDate": "Due:",
    "billList.label.issueDate": "Issued:",
    "billList.label.financialLoad": "Financial Load",
    "billList.alert.overdue": "CRITICAL ALERT: Obligation overdue by {days} operational cycles",
    "billList.alert.overdueNoDate": "CRITICAL ALERT: Overdue obligation with no defined date",

    // BillList - Analytics
    "billList.analytics.title": "Liabilities Mesh",
    "billList.analytics.subtitle": "Historical obligations monitoring",
    "billList.analytics.documents": "Documents",
    "billList.analytics.totalVolume": "Total Volume",
    "billList.analytics.settled": "Settled",
    "billList.analytics.pending": "Pending",
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

console.log('\n✅ Accounts Payable translation keys added!');
console.log(`📊 Components: SupplierForm, BillList`);
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
