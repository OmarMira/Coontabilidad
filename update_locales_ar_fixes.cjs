const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/assets/locales');
const esPath = path.join(localesDir, 'es.json');
const enPath = path.join(localesDir, 'en.json');

const newKeysES = {
    quotes: {
        filterStatus: "Filtrar por estado",
        status: {
            all: "Todas",
            draft: "Borrador",
            sent: "Enviada",
            accepted: "Aceptada",
            rejected: "Rechazada",
            expired: "Expirada",
            converted: "Convertida"
        },
        count: "{count} cotización(es)",
        emptyList: "No hay cotizaciones para mostrar",
        quoteNumber: "Cotización #",
        customer: "Cliente",
        issueDate: "Fecha Emisión",
        expirationDate: "Fecha Expiración",
        total: "Total",
        notes: "Notas",
        actions: {
            view: "Ver detalles",
            edit: "Editar",
            convert: "Convertir a factura",
            delete: "Eliminar"
        },
        alerts: {
            onlyAccepted: "Solo se pueden convertir cotizaciones aceptadas",
            confirmConvert: "¿Convertir la cotización {number} en factura?",
            confirmDelete: "¿Estás seguro de eliminar esta cotización?"
        }
    },
    receivableReports: {
        title: "Reportes de Cuentas por Cobrar",
        subtitle: "Antigüedad de saldos y análisis de cartera",
        print: "Imprimir",
        export: "Exportar",
        totalReceivable: "Total por Cobrar",
        customersWithDebt: "Clientes con Deuda",
        overdue90: "Vencido > 90 días",
        collectionsToday: "Cobros Hoy",
        portfolioDetail: "Detalle de Cartera por Cliente",
        filter: "Filtrar",
        table: {
            customer: "Cliente",
            current: "Al Corriente",
            days1_30: "1-30 Días",
            days31_60: "31-60 Días",
            days61_plus: "61+ Días",
            totalDebt: "Total Deuda",
            empty: "No hay cuentas por cobrar pendientes."
        }
    },
    salesInvoiceForm: {
        title: "Nueva Venta (Producción)",
        customer: "Cliente",
        selectCustomer: "Seleccionar Cliente...",
        taxJurisdiction: "Jurisdicción Fiscal (Condado)",
        taxJurisdictionHint: "Determina la Tasa de Sobretasa (ej. Miami-Dade 1%)",
        items: "Artículos",
        addLine: "Agregar Línea",
        table: {
            selectProduct: "Seleccionar Producto...",
            description: "Descripción",
            quantity: "Cant",
            price: "Precio",
            taxable: "Taxable"
        },
        subtotalEst: "Subtotal Est.",
        taxNote: "Impuesto y Total final calculados por el motor al enviar.",
        processSale: "Procesar Venta",
        processing: "Procesando...",
        errors: {
            customerRequired: "El cliente es requerido",
            transactionFailed: "Transacción Fallida"
        }
    }
};

const newKeysEN = {
    quotes: {
        filterStatus: "Filter by status",
        status: {
            all: "All",
            draft: "Draft",
            sent: "Sent",
            accepted: "Accepted",
            rejected: "Rejected",
            expired: "Expired",
            converted: "Converted"
        },
        count: "{count} quote(s)",
        emptyList: "No quotes to show",
        quoteNumber: "Quote #",
        customer: "Customer",
        issueDate: "Issue Date",
        expirationDate: "Expiration Date",
        total: "Total",
        notes: "Notes",
        actions: {
            view: "View details",
            edit: "Edit",
            convert: "Convert to invoice",
            delete: "Delete"
        },
        alerts: {
            onlyAccepted: "Only accepted quotes can be converted",
            confirmConvert: "Convert quote {number} to invoice?",
            confirmDelete: "Are you sure you want to delete this quote?"
        }
    },
    receivableReports: {
        title: "Accounts Receivable Reports",
        subtitle: "Aging balances and portfolio analysis",
        print: "Print",
        export: "Export",
        totalReceivable: "Total Receivable",
        customersWithDebt: "Customers with Debt",
        overdue90: "Overdue > 90 days",
        collectionsToday: "Collections Today",
        portfolioDetail: "Portfolio Detail by Customer",
        filter: "Filter",
        table: {
            customer: "Customer",
            current: "Current",
            days1_30: "1-30 Days",
            days31_60: "31-60 Days",
            days61_plus: "61+ Days",
            totalDebt: "Total Debt",
            empty: "No pending accounts receivable."
        }
    },
    salesInvoiceForm: {
        title: "New Sale (Production)",
        customer: "Customer",
        selectCustomer: "Select Customer...",
        taxJurisdiction: "Tax Jurisdiction (County)",
        taxJurisdictionHint: "Determines Surtax Rate (e.g., Miami-Dade 1%)",
        items: "Items",
        addLine: "Add Line",
        table: {
            selectProduct: "Select Product...",
            description: "Description",
            quantity: "Qty",
            price: "Price",
            taxable: "Taxable"
        },
        subtotalEst: "Est. Subtotal",
        taxNote: "Tax and Final Total calculated by engine on submit.",
        processSale: "Process Sale",
        processing: "Processing...",
        errors: {
            customerRequired: "Customer is required",
            transactionFailed: "Transaction Failed"
        }
    }
};

function updateLocale(filePath, newKeysES) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        let json = JSON.parse(data);

        // Deep merge helper
        function deepMerge(target, source) {
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    Object.assign(source[key], deepMerge(target[key], source[key]))
                }
            }
            Object.assign(target || {}, source)
            return target;
        }

        // Since we want to append/overwrite specific keys, simple assign is enough for top level unique keys
        // But let's use a simple merge loop
        for (const section in newKeysES) {
            json[section] = newKeysES[section];
        }

        // Helper to sort keys
        const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {})
        json = sortObject(json);

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`Updated ${filePath}`);
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
    }
}

// Call with correct keys
updateLocale(esPath, newKeysES);
updateLocale(enPath, newKeysEN);
