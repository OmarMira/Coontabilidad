/**
 * ACCOUNTS PAYABLE - BATCH TRANSLATION KEYS (PART 2)
 * Components: BillForm, SupplierPayments, PurchaseOrdersList, PurchaseOrderForm, PurchaseOrderReceiving, PayableReports
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // === BillForm ===
    "billForm.titleNew": "Registrar Factura de Compra",
    "billForm.titleEdit": "Ajustar Obligación",
    "billForm.protocol": "AP Forensic Protocol v2.5",
    "billForm.primarySupplier": "Aliado Primario",
    "billForm.selectSupplier": "SELECCIONAR ALIADO",
    "billForm.supplierMetadata": "Metadata Aliado",
    "billForm.jurisdiction": "Jurisdicción",
    "billForm.terms": "Términos",
    "billForm.days": "DÍAS",
    "billForm.issueDate": "Eje Temporal: Emisión",
    "billForm.dueDate": "Eje Temporal: Vencimiento",
    "billForm.operationalStatus": "Estatus Operativo",
    "billForm.auditNotes": "Notas de Auditoría",
    "billForm.notesPlaceholder": "MEMORANDUM INTERNO...",
    "billForm.transactionMatrix": "Matriz de Transacciones",
    "billForm.addLine": "Adjuntar Nueva Línea",
    "billForm.productSku": "PRODUCTO / SKU",
    "billForm.description": "DESCRIPCIÓN TÉCNICA...",
    "billForm.subtotal": "Subtotal",
    "billForm.netSubtotal": "Subtotal Neto",
    "billForm.taxFlorida": "Impuesto Florida",
    "billForm.totalObligated": "Total Obligado",
    "billForm.abortProtocol": "Abortar Protocolo",
    "billForm.confirmAdjustment": "Confirmar Ajuste",
    "billForm.registerObligation": "Registrar Obligación",
    "billForm.validation.supplier": "⚠️ Debes seleccionar un proveedor",
    "billForm.validation.items": "⚠️ Debes agregar al menos un item a la factura",

    // === SupplierPayments ===
    "supplierPayments.title": "Pagos a Proveedores",
    "supplierPayments.subtitle": "Gestiona los pagos realizados a proveedores",
    "supplierPayments.searchPlaceholder": "Buscar por proveedor o número de factura...",
    "supplierPayments.filter.pending": "Pendientes",
    "supplierPayments.filter.paid": "Pagadas",
    "supplierPayments.filter.all": "Todas",
    "supplierPayments.listTitle": "Facturas Pendientes de Pago",
    "supplierPayments.col.bill": "Factura",
    "supplierPayments.col.supplier": "Proveedor",
    "supplierPayments.col.date": "Fecha",
    "supplierPayments.col.amount": "Monto",
    "supplierPayments.col.dueDate": "Vencimiento",
    "supplierPayments.col.actions": "Acciones",
    "supplierPayments.status.overdue": "Vencida {days} días",
    "supplierPayments.status.dueToday": "Vence hoy",
    "supplierPayments.status.daysLeft": "{days} días",
    "supplierPayments.action.pay": "Pagar",
    "supplierPayments.empty.pending": "No hay facturas pendientes de pago",
    "supplierPayments.empty.filtered": "No se encontraron facturas con los filtros aplicados",
    "supplierPayments.empty.title": "No hay facturas",
    "supplierPayments.unknownSupplier": "Proveedor desconocido",

    // Payment Modal
    "paymentModal.title": "Registrar Pago a Proveedor",
    "paymentModal.bill": "Factura:",
    "paymentModal.supplier": "Proveedor:",
    "paymentModal.totalAmount": "Monto Total:",
    "paymentModal.paymentAmount": "Monto del Pago",
    "paymentModal.paymentDate": "Fecha de Pago",
    "paymentModal.paymentMethod": "Método de Pago",
    "paymentModal.selectMethod": "Seleccionar método...",
    "paymentModal.noMethods": "No hay métodos de pago configurados. Ve a Archivo → Métodos de Pago para agregar algunos.",
    "paymentModal.reference": "Referencia/Número",
    "paymentModal.referencePlaceholder": "Número de transferencia, cheque, etc.",
    "paymentModal.notes": "Notas (Opcional)",
    "paymentModal.notesPlaceholder": "Notas adicionales sobre el pago...",
    "paymentModal.cancel": "Cancelar",
    "paymentModal.submit": "Registrar Pago",
    "paymentModal.processing": "Procesando...",

    // === PurchaseOrdersList ===
    "purchaseOrders.title": "Órdenes de Compra",
    "purchaseOrders.newOrder": "Nueva Orden",
    "purchaseOrders.col.order": "# Orden",
    "purchaseOrders.col.supplier": "Proveedor",
    "purchaseOrders.col.date": "Fecha",
    "purchaseOrders.col.total": "Total",
    "purchaseOrders.col.status": "Estado",
    "purchaseOrders.empty": "No hay órdenes de compra registradas.",
    "purchaseOrders.status.draft": "BORRADOR",
    "purchaseOrders.status.approved": "APROBADA",
    "purchaseOrders.status.received": "RECIBIDA",
    "purchaseOrders.status.cancelled": "CANCELADA",
    "purchaseOrders.tooltip.receive": "Recibir Mercancía",
    "purchaseOrders.tooltip.viewMovements": "Ver Movimientos",
    "purchaseOrders.validation.missingResources": "Faltan Proveedores y Productos. Registre ambos antes de crear una orden.",
    "purchaseOrders.validation.missingSuppliers": "Faltan Proveedores. Registre al menos un proveedor.",
    "purchaseOrders.validation.missingProducts": "Faltan Productos. Registre al menos un producto.",

    // === PurchaseOrderForm ===
    "poForm.title": "Nueva Orden de Compra",
    "poForm.cancel": "Cancelar",
    "poForm.saveDraft": "Guardar Borrador",
    "poForm.supplier": "PROVEEDOR",
    "poForm.selectSupplier": "Seleccionar...",
    "poForm.noSuppliers": "No hay proveedores registrados",
    "poForm.warning.createSuppliers": "⚠️ Debe crear proveedores primero en el módulo de Compras.",
    "poForm.issueDate": "FECHA EMISIÓN",
    "poForm.expectedDate": "FECHA ESPERADA",
    "poForm.col.product": "Producto",
    "poForm.col.quantity": "Cantidad",
    "poForm.col.unitCost": "Costo Unit.",
    "poForm.col.total": "Total",
    "poForm.addProductPlaceholder": "Agregar producto...",
    "poForm.noProducts": "No hay productos activos",
    "poForm.warning.createProducts": "⚠️ No hay productos. Registre productos en Inventario.",
    "poForm.qtyPlaceholder": "Cant",
    "poForm.costPlaceholder": "Costo",
    "poForm.notesLabel": "NOTAS / COMENTARIOS",
    "poForm.notesPlaceholder": "Instrucciones para el proveedor...",
    "poForm.subtotal": "Subtotal",
    "poForm.totalOrder": "Total Orden",
    "poForm.validation.selectSupplier": "Seleccione un proveedor",
    "poForm.validation.addItems": "Agregue al menos un producto",
    "poForm.success.created": "Orden de Compra creada",
    "poForm.error.create": "Error al crear orden: ",

    // === PurchaseOrderReceiving ===
    "poReceiving.title": "Recepción de Mercancía",
    "poReceiving.order": "Orden de Compra:",
    "poReceiving.supplier": "Proveedor:",
    "poReceiving.total": "Total Orden:",
    "poReceiving.info": "Al confirmar, el sistema registrará la entrada de inventario automáticamente en el Kardex y actualizará las existencias disponibles de todos los productos en la orden.",
    "poReceiving.cancel": "Cancelar",
    "poReceiving.confirm": "Confirmar Recepción",
    "poReceiving.processing": "Procesando...",
    "poReceiving.confirmDialog": "¿Confirmar recepción de mercancía para Orden #{number}? Esto aumentará el stock de los productos.",
    "poReceiving.success": "Mercancía recibida e inventario actualizado",
    "poReceiving.error": "Error al recibir: ",
    "poReceiving.error unexpected": "Error inesperado",

    // === PayableReports ===
    "payableReports.agingBalance": "Antigüedad de Saldos (Proveedores)",
    "payableReports.days030": "0-30 Días",
    "payableReports.days3160": "31-60 Días",
    "payableReports.days6190": "61-90 Días",
    "payableReports.days90plus": "90+ Días",
};

const enKeys = {
    // === BillForm ===
    "billForm.titleNew": "Register Purchase Bill",
    "billForm.titleEdit": "Adjust Obligation",
    "billForm.protocol": "AP Forensic Protocol v2.5",
    "billForm.primarySupplier": "Primary Supplier",
    "billForm.selectSupplier": "SELECT SUPPLIER",
    "billForm.supplierMetadata": "Supplier Metadata",
    "billForm.jurisdiction": "Jurisdiction",
    "billForm.terms": "Terms",
    "billForm.days": "DAYS",
    "billForm.issueDate": "Temporal Axis: Issue",
    "billForm.dueDate": "Temporal Axis: Due Date",
    "billForm.operationalStatus": "Operational Status",
    "billForm.auditNotes": "Audit Notes",
    "billForm.notesPlaceholder": "INTERNAL MEMORANDUM...",
    "billForm.transactionMatrix": "Transaction Matrix",
    "billForm.addLine": "Attach New Line",
    "billForm.productSku": "PRODUCT / SKU",
    "billForm.description": "TECHNICAL DESCRIPTION...",
    "billForm.subtotal": "Subtotal",
    "billForm.netSubtotal": "Net Subtotal",
    "billForm.taxFlorida": "Florida Tax",
    "billForm.totalObligated": "Total Obligated",
    "billForm.abortProtocol": "Abort Protocol",
    "billForm.confirmAdjustment": "Confirm Adjustment",
    "billForm.registerObligation": "Register Obligation",
    "billForm.validation.supplier": "⚠️ You must select a supplier",
    "billForm.validation.items": "⚠️ You must add at least one item to the bill",

    // === SupplierPayments ===
    "supplierPayments.title": "Supplier Payments",
    "supplierPayments.subtitle": "Manage payments made to suppliers",
    "supplierPayments.searchPlaceholder": "Search by supplier or bill number...",
    "supplierPayments.filter.pending": "Pending",
    "supplierPayments.filter.paid": "Paid",
    "supplierPayments.filter.all": "All",
    "supplierPayments.listTitle": "Bills Pending Payment",
    "supplierPayments.col.bill": "Bill",
    "supplierPayments.col.supplier": "Supplier",
    "supplierPayments.col.date": "Date",
    "supplierPayments.col.amount": "Amount",
    "supplierPayments.col.dueDate": "Due Date",
    "supplierPayments.col.actions": "Actions",
    "supplierPayments.status.overdue": "Overdue {days} days",
    "supplierPayments.status.dueToday": "Due today",
    "supplierPayments.status.daysLeft": "{days} days",
    "supplierPayments.action.pay": "Pay",
    "supplierPayments.empty.pending": "No bills pending payment",
    "supplierPayments.empty.filtered": "No bills found with applied filters",
    "supplierPayments.empty.title": "No bills",
    "supplierPayments.unknownSupplier": "Unknown Supplier",

    // Payment Modal
    "paymentModal.title": "Register Supplier Payment",
    "paymentModal.bill": "Bill:",
    "paymentModal.supplier": "Supplier:",
    "paymentModal.totalAmount": "Total Amount:",
    "paymentModal.paymentAmount": "Payment Amount",
    "paymentModal.paymentDate": "Payment Date",
    "paymentModal.paymentMethod": "Payment Method",
    "paymentModal.selectMethod": "Select method...",
    "paymentModal.noMethods": "No payment methods configured. Go to Files → Payment Methods to add some.",
    "paymentModal.reference": "Reference/Number",
    "paymentModal.referencePlaceholder": "Transfer number, check, etc.",
    "paymentModal.notes": "Notes (Optional)",
    "paymentModal.notesPlaceholder": "Additional notes about payment...",
    "paymentModal.cancel": "Cancel",
    "paymentModal.submit": "Register Payment",
    "paymentModal.processing": "Processing...",

    // === PurchaseOrdersList ===
    "purchaseOrders.title": "Purchase Orders",
    "purchaseOrders.newOrder": "New Order",
    "purchaseOrders.col.order": "Order #",
    "purchaseOrders.col.supplier": "Supplier",
    "purchaseOrders.col.date": "Date",
    "purchaseOrders.col.total": "Total",
    "purchaseOrders.col.status": "Status",
    "purchaseOrders.empty": "No purchase orders registered.",
    "purchaseOrders.status.draft": "DRAFT",
    "purchaseOrders.status.approved": "APPROVED",
    "purchaseOrders.status.received": "RECEIVED",
    "purchaseOrders.status.cancelled": "CANCELLED",
    "purchaseOrders.tooltip.receive": "Receive Goods",
    "purchaseOrders.tooltip.viewMovements": "View Movements",
    "purchaseOrders.validation.missingResources": "Missing Suppliers and Products. Register both before creating an order.",
    "purchaseOrders.validation.missingSuppliers": "Missing Suppliers. Register at least one supplier.",
    "purchaseOrders.validation.missingProducts": "Missing Products. Register at least one product.",

    // === PurchaseOrderForm ===
    "poForm.title": "New Purchase Order",
    "poForm.cancel": "Cancel",
    "poForm.saveDraft": "Save Draft",
    "poForm.supplier": "SUPPLIER",
    "poForm.selectSupplier": "Select...",
    "poForm.noSuppliers": "No suppliers registered",
    "poForm.warning.createSuppliers": "⚠️ You must create suppliers first in the Purchasing module.",
    "poForm.issueDate": "ISSUE DATE",
    "poForm.expectedDate": "EXPECTED DATE",
    "poForm.col.product": "Product",
    "poForm.col.quantity": "Quantity",
    "poForm.col.unitCost": "Unit Cost",
    "poForm.col.total": "Total",
    "poForm.addProductPlaceholder": "Add product...",
    "poForm.noProducts": "No active products",
    "poForm.warning.createProducts": "⚠️ No products. Register products in Inventory.",
    "poForm.qtyPlaceholder": "Qty",
    "poForm.costPlaceholder": "Cost",
    "poForm.notesLabel": "NOTES / COMMENTS",
    "poForm.notesPlaceholder": "Instructions for supplier...",
    "poForm.subtotal": "Subtotal",
    "poForm.totalOrder": "Order Total",
    "poForm.validation.selectSupplier": "Select a supplier",
    "poForm.validation.addItems": "Add at least one product",
    "poForm.success.created": "Purchase Order created",
    "poForm.error.create": "Error creating order: ",

    // === PurchaseOrderReceiving ===
    "poReceiving.title": "Goods Receiving",
    "poReceiving.order": "Purchase Order:",
    "poReceiving.supplier": "Supplier:",
    "poReceiving.total": "Order Total:",
    "poReceiving.info": "Upon confirmation, the system will automatically register inventory entry in Kardex and update available stock for all products in the order.",
    "poReceiving.cancel": "Cancel",
    "poReceiving.confirm": "Confirm Receipt",
    "poReceiving.processing": "Processing...",
    "poReceiving.confirmDialog": "Confirm goods receipt for Order #{number}? This will increase product stock.",
    "poReceiving.success": "Goods received and inventory updated",
    "poReceiving.error": "Error receiving: ",
    "poReceiving.error unexpected": "Unexpected error",

    // === PayableReports ===
    "payableReports.agingBalance": "Aging Balance (Suppliers)",
    "payableReports.days030": "0-30 Days",
    "payableReports.days3160": "31-60 Days",
    "payableReports.days6190": "61-90 Days",
    "payableReports.days90plus": "90+ Days",
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

console.log('\n✅ Accounts Payable Part 2 translation keys added!');
console.log(`📊 Components: BillForm, SupplierPayments, POs, Reports`);
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
