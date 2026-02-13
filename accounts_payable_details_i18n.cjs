const fs = require('fs');
const path = require('path');

// Caminos a los archivos de traducción
const esPath = path.join(__dirname, 'src', 'assets', 'locales', 'es.json');
const enPath = path.join(__dirname, 'src', 'assets', 'locales', 'en.json');

// Función para leer JSON
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Función para escribir JSON
function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Nuevas claves de traducción para Detail Views
const newKeys = {
    supplierDetail: {
        tabs: {
            overview: { es: "Resumen", en: "Overview" },
            bills: { es: "Facturas de Compra", en: "Purchase Bills" },
            payments: { es: "Pagos Realizados", en: "Payments Made" },
            products: { es: "Productos/Servicios", en: "Products/Services" }
        },
        section: {
            info: { es: "Información del Proveedor", en: "Supplier Information" },
            contact: { es: "Contacto", en: "Contact" },
            address: { es: "Dirección", en: "Address" },
            commercial: { es: "Datos Comerciales", en: "Commercial Data" },
            notes: { es: "Notas", en: "Notes" }
        },
        label: {
            name: { es: "Nombre/Razón Social", en: "Name/Business Name" },
            businessName: { es: "Nombre Comercial", en: "Trade Name" },
            document: { es: "Documento", en: "Document" },
            businessType: { es: "Tipo de Negocio", en: "Business Type" },
            emailMain: { es: "Email Principal", en: "Main Email" },
            emailSec: { es: "Email Secundario", en: "Secondary Email" },
            phoneMain: { es: "Teléfono Principal", en: "Main Phone" },
            phoneSec: { es: "Teléfono Secundario", en: "Secondary Phone" },
            county: { es: "Condado", en: "County" },
            creditLimit: { es: "Límite de Crédito", en: "Credit Limit" },
            paymentTerms: { es: "Términos de Pago", en: "Payment Terms" },
            buyer: { es: "Comprador Asignado", en: "Assigned Buyer" },
            status: { es: "Estado", en: "Status" },
            taxExempt: { es: "Exento de Impuestos", en: "Tax Exempt" },
            days: { es: "días", en: "days" }
        },
        status: {
            active: { es: "Activo", en: "Active" },
            inactive: { es: "Inactivo", en: "Inactive" },
            suspended: { es: "Suspendido", en: "Suspended" }
        },
        actions: {
            edit: { es: "Editar Proveedor", en: "Edit Supplier" },
            newBill: { es: "Nueva Factura de Compra", en: "New Purchase Bill" },
            recordPayment: { es: "Registrar Pago", en: "Record Payment" },
            view: { es: "Ver", en: "View" }
        },
        products: {
            lastPurchase: { es: "Última compra", en: "Last purchase" },
            totalPurchases: { es: "Total compras", en: "Total purchases" },
            totalAmount: { es: "Monto total", en: "Total amount" },
            empty: { es: "Aún no se han registrado compras a este proveedor.", en: "No purchases recorded for this supplier yet." }
        }
    },
    billDetail: {
        title: { es: "Detalle de Factura", en: "Bill Details" },
        status: {
            draft: { es: "Borrador", en: "Draft" },
            received: { es: "Recibida", en: "Received" },
            approved: { es: "Aprobada", en: "Approved" },
            paid: { es: "Pagada", en: "Paid" },
            overdue: { es: "Vencida", en: "Overdue" },
            cancelled: { es: "Cancelada", en: "Cancelled" }
        },
        actions: {
            edit: { es: "Editar Factura", en: "Edit Bill" },
            back: { es: "Volver", en: "Back" }
        },
        section: {
            supplierInfo: { es: "Información del Proveedor", en: "Supplier Information" },
            billDetails: { es: "Detalles de la Factura", en: "Bill Details" },
            lines: { es: "Líneas de Factura", en: "Bill Lines" },
            summary: { es: "Resumen de Factura", en: "Bill Summary" }
        },
        label: {
            supplierName: { es: "Nombre del Proveedor", en: "Supplier Name" },
            unknownSupplier: { es: "Proveedor Desconocido", en: "Unknown Supplier" },
            email: { es: "Email", en: "Email" },
            phone: { es: "Teléfono", en: "Phone" },
            address: { es: "Dirección", en: "Address" },
            billNumber: { es: "Número de Factura", en: "Bill Number" },
            issueDate: { es: "Fecha de Emisión", en: "Issue Date" },
            dueDate: { es: "Fecha de Vencimiento", en: "Due Date" },
            created: { es: "Creada", en: "Created" },
            notes: { es: "Notas", en: "Notes" },
            description: { es: "Descripción", en: "Description" },
            quantity: { es: "Cantidad", en: "Quantity" },
            unitPrice: { es: "Precio Unitario", en: "Unit Price" },
            taxable: { es: "Gravable", en: "Taxable" },
            lineTotal: { es: "Total Línea", en: "Line Total" },
            subtotal: { es: "Subtotal", en: "Subtotal" },
            taxes: { es: "Impuestos (FL)", en: "Taxes (FL)" },
            total: { es: "Total", en: "Total" }
        },
        messages: {
            overdueTitle: { es: "Factura Vencida", en: "Bill Overdue" },
            overdueDesc: { es: "Esta factura está vencida por {days} días. Considera realizar el pago lo antes posible.", en: "This bill is overdue by {days} days. Please consider making payment as soon as possible." },
            paidTitle: { es: "Factura Pagada", en: "Bill Paid" },
            paidDesc: { es: "Esta factura ha sido marcada como pagada. El pago ha sido procesado correctamente.", en: "This bill has been marked as paid. Payment has been successfully processed." },
            approvedTitle: { es: "Factura Aprobada", en: "Bill Approved" },
            approvedDesc: { es: "Esta factura ha sido aprobada y está lista para el pago.", en: "This bill has been approved and is ready for payment." }
        }
    }
};

// Función recursiva para mezclar objetos (deep merge simple)
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

// Proceso principal
function updateTranslations() {
    console.log('Actualizando traducciones para Detail Views...');

    // Cargar archivos actuales
    const esData = readJson(esPath);
    const enData = readJson(enPath);

    // Preparar objetos parciales
    const esUpdates = {};
    const enUpdates = {};

    function extractLocales(obj, prefix = '') {
        for (const key in obj) {
            if (obj[key].es && obj[key].en) {
                // Es un nodo hoja con traducciones
                const pathParts = prefix ? [...prefix.split('.'), key] : [key];

                // Construir estructura anidada para ES
                let currentEs = esUpdates;
                pathParts.forEach((part, index) => {
                    if (index === pathParts.length - 1) {
                        currentEs[part] = obj[key].es;
                    } else {
                        currentEs[part] = currentEs[part] || {};
                        currentEs = currentEs[part];
                    }
                });

                // Construir estructura anidada para EN
                let currentEn = enUpdates;
                pathParts.forEach((part, index) => {
                    if (index === pathParts.length - 1) {
                        currentEn[part] = obj[key].en;
                    } else {
                        currentEn[part] = currentEn[part] || {};
                        currentEn = currentEn[part];
                    }
                });
            } else if (typeof obj[key] === 'object') {
                // Recurso
                extractLocales(obj[key], prefix ? `${prefix}.${key}` : key);
            }
        }
    }

    extractLocales(newKeys);

    // Fusionar y guardar
    const updatedEs = deepMerge(esData, esUpdates);
    const updatedEn = deepMerge(enData, enUpdates);

    writeJson(esPath, updatedEs);
    writeJson(enPath, updatedEn);

    console.log(' Traducciones actualizadas con éxito!');
}

updateTranslations();
