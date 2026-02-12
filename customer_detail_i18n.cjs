
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "common.overview": "Resumen",
    "common.invoices": "Facturas",
    "common.payments": "Pagos",
    "common.productsServices": "Productos/Servicios",
    "common.edit": "Editar",
    "common.view": "Ver",
    "common.delete": "Eliminar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.active": "Activo",
    "common.inactive": "Inactivo",
    "common.suspended": "Suspendido",
    "common.status": "Estado",
    "common.notes": "Notas",
    "common.date": "Fecha",
    "common.amount": "Monto",
    "common.total": "Total",
    "common.actions": "Acciones",
    "common.search": "Buscar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",

    "customerDetail.personalInfo": "Información Personal",
    "customerDetail.name": "Nombre/Razón Social",
    "customerDetail.businessName": "Nombre Comercial",
    "customerDetail.document": "Documento",
    "customerDetail.businessType": "Tipo de Negocio",
    "customerDetail.contact": "Contacto",
    "customerDetail.primaryEmail": "Email Principal",
    "customerDetail.secondaryEmail": "Email Secundario",
    "customerDetail.primaryPhone": "Teléfono Principal",
    "customerDetail.secondaryPhone": "Teléfono Secundario",
    "customerDetail.address": "Dirección",
    "customerDetail.county": "Condado",
    "customerDetail.commercialData": "Datos Comerciales",
    "customerDetail.creditLimit": "Límite de Crédito",
    "customerDetail.paymentTerms": "Términos de Pago",
    "customerDetail.salesperson": "Vendedor Asignado",
    "customerDetail.taxExempt": "Exento de Impuestos",
    "customerDetail.customerInvoices": "Facturas del Cliente",
    "customerDetail.newInvoice": "Nueva Factura",
    "customerDetail.invoiceNumber": "Número",
    "customerDetail.dueDate": "Vencimiento",
    "customerDetail.paymentHistory": "Historial de Pagos",
    "customerDetail.registerPayment": "Registrar Pago",
    "customerDetail.paymentMethod": "Método",
    "customerDetail.reference": "Referencia",
    "customerDetail.purchasedProducts": "Productos y Servicios Comprados",
    "customerDetail.totalPurchases": "Total compras",
    "customerDetail.totalAmount": "Monto total",
    "customerDetail.viewMovements": "VER HISTORIAL MOVIMIENTOS",
    "customerDetail.noProducts": "Este cliente aún no ha comprado productos o servicios.",
    "customerDetail.editCustomer": "Editar Cliente",
    "customerDetail.lastPurchase": "Última compra",

    "paymentMethods.cash": "Efectivo",
    "paymentMethods.check": "Cheque",
    "paymentMethods.creditCard": "Tarjeta de Crédito",
    "paymentMethods.bankTransfer": "Transferencia Bancaria",
    "paymentMethods.other": "Otro"
};

const enUpdates = {
    "common.overview": "Overview",
    "common.invoices": "Invoices",
    "common.payments": "Payments",
    "common.productsServices": "Products/Services",
    "common.edit": "Edit",
    "common.view": "View",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.suspended": "Suspended",
    "common.status": "Status",
    "common.notes": "Notes",
    "common.date": "Date",
    "common.amount": "Amount",
    "common.total": "Total",
    "common.actions": "Actions",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",

    "customerDetail.personalInfo": "Personal Information",
    "customerDetail.name": "Name/Legal Name",
    "customerDetail.businessName": "Trade Name",
    "customerDetail.document": "Document",
    "customerDetail.businessType": "Business Type",
    "customerDetail.contact": "Contact",
    "customerDetail.primaryEmail": "Primary Email",
    "customerDetail.secondaryEmail": "Secondary Email",
    "customerDetail.primaryPhone": "Primary Phone",
    "customerDetail.secondaryPhone": "Secondary Phone",
    "customerDetail.address": "Address",
    "customerDetail.county": "County",
    "customerDetail.commercialData": "Commercial Data",
    "customerDetail.creditLimit": "Credit Limit",
    "customerDetail.paymentTerms": "Payment Terms",
    "customerDetail.salesperson": "Assigned Salesperson",
    "customerDetail.taxExempt": "Tax Exempt",
    "customerDetail.customerInvoices": "Customer Invoices",
    "customerDetail.newInvoice": "New Invoice",
    "customerDetail.invoiceNumber": "Number",
    "customerDetail.dueDate": "Due Date",
    "customerDetail.paymentHistory": "Payment History",
    "customerDetail.registerPayment": "Register Payment",
    "customerDetail.paymentMethod": "Method",
    "customerDetail.reference": "Reference",
    "customerDetail.purchasedProducts": "Purchased Products & Services",
    "customerDetail.totalPurchases": "Total purchases",
    "customerDetail.totalAmount": "Total amount",
    "customerDetail.viewMovements": "VIEW MOVEMENT HISTORY",
    "customerDetail.noProducts": "This customer has not purchased any products or services yet.",
    "customerDetail.editCustomer": "Edit Customer",
    "customerDetail.lastPurchase": "Last purchase",

    "paymentMethods.cash": "Cash",
    "paymentMethods.check": "Check",
    "paymentMethods.creditCard": "Credit Card",
    "paymentMethods.bankTransfer": "Bank Transfer",
    "paymentMethods.other": "Other"
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
