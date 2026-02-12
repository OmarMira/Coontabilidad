
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "invoiceList.title": "Panel de Facturación",
    "invoiceList.newSale": "Nueva Venta",
    "invoiceList.searchPlaceholder": "Buscar por número, nombre o razón social...",
    "invoiceList.allStatuses": "Todos los Estados",
    "invoiceList.issueDate": "Fecha Emisión",
    "invoiceList.dueDate": "Vencimiento",
    "invoiceList.tax": "Impuesto",
    "invoiceList.created": "Grabado",
    "invoiceList.note": "Nota",
    "invoiceList.viewInvoice": "Ver Factura",
    "invoiceList.generateIn": "Generar en",
    "invoiceList.editInvoice": "Editar Factura",
    "invoiceList.deleteInvoice": "Eliminar Factura",
    "invoiceList.cannotDeletePaid": "No se puede eliminar una factura pagada",
    "invoiceList.overdueWarning": "⚠️ Factura vencida hace {days} días",
    "invoiceList.totalInvoices": "Total Facturas",
    "invoiceList.totalAmount": "Monto Total",
    "invoiceList.paidCount": "Total Pagadas",
    "invoiceList.pendingAmount": "Total Pendiente",
    "invoiceList.unknownCustomer": "Cliente no Identificado",
    "invoiceList.cancelled": "Anulada",
    "invoiceList.noInvoices": "No hay facturas de venta",
    "invoiceList.noInvoicesMessage": "Aún no se han emitido facturas en este periodo.",
    "invoiceList.createInvoice": "Empezar a facturar",
    "invoiceList.cannotDeletePaidAlert": "No es posible eliminar facturas pagadas. Por favor anule el pago primero.",
    "invoiceList.viewInventoryOutputs": "Ver Salidas de Inventario",
    "invoiceList.paid": "Pagada",
    "invoiceList.sent": "Enviada",
    "invoiceList.overdue": "Vencida",
    "invoiceList.draft": "Borrador",
    "invoiceList.confirmDelete": "¿Desea eliminar la factura {number}? Esta acción es irreversible."
};

const enUpdates = {
    "invoiceList.title": "Billing Panel",
    "invoiceList.newSale": "New Sale",
    "invoiceList.searchPlaceholder": "Search by number, name or business name...",
    "invoiceList.allStatuses": "All Statuses",
    "invoiceList.issueDate": "Issue Date",
    "invoiceList.dueDate": "Due Date",
    "invoiceList.tax": "Tax",
    "invoiceList.created": "Created",
    "invoiceList.note": "Note",
    "invoiceList.viewInvoice": "View Invoice",
    "invoiceList.generateIn": "Generate in",
    "invoiceList.editInvoice": "Edit Invoice",
    "invoiceList.deleteInvoice": "Delete Invoice",
    "invoiceList.cannotDeletePaid": "Cannot delete a paid invoice",
    "invoiceList.overdueWarning": "⚠️ Invoice overdue by {days} days",
    "invoiceList.totalInvoices": "Total Invoices",
    "invoiceList.totalAmount": "Total Amount",
    "invoiceList.paidCount": "Total Paid",
    "invoiceList.pendingAmount": "Total Pending",
    "invoiceList.unknownCustomer": "Unknown Customer",
    "invoiceList.cancelled": "Cancelled",
    "invoiceList.noInvoices": "No sales invoices",
    "invoiceList.noInvoicesMessage": "No invoices have been issued yet in this period.",
    "invoiceList.createInvoice": "Start billing",
    "invoiceList.cannotDeletePaidAlert": "It is not possible to delete paid invoices. Please void the payment first.",
    "invoiceList.viewInventoryOutputs": "View Inventory Outputs",
    "invoiceList.paid": "Paid",
    "invoiceList.sent": "Sent",
    "invoiceList.overdue": "Overdue",
    "invoiceList.draft": "Draft",
    "invoiceList.confirmDelete": "Are you sure you want to delete invoice {number}? This action is irreversible."
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
