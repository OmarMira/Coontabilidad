const fs = require('fs');
const path = require('path');

// Adjusted path to match the correct location of translation files
const localesDir = path.join(__dirname, 'src', 'assets', 'locales');
const esPath = path.join(localesDir, 'es.json');
const enPath = path.join(localesDir, 'en.json');

// Helper to read JSON
const readJson = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
    }
    return {};
};

// Helper to write JSON
const writeJson = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${filePath}`);
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err);
    }
};

const esData = readJson(esPath);
const enData = readJson(enPath);

const newKeys = {
    customerList: {
        title: { es: "CLIENTES", en: "CUSTOMERS" },
        subtitle: { es: "GESTIÓN DE CARTERA", en: "PORTFOLIO MANAGEMENT" },
        searchPlaceholder: { es: "BUSCAR POR NOMBRE, EMAIL O TEL...", en: "SEARCH BY NAME, EMAIL OR PHONE..." },
        allCounties: { es: "TODOS LOS CONDADOS", en: "ALL COUNTIES" },
        registerCustomer: { es: "REGISTRAR CLIENTE", en: "REGISTER CUSTOMER" },
        emptyTitle: { es: "NO HAY CLIENTES REGISTRADOS", en: "NO CUSTOMERS REGISTERED" },
        emptyMessage: { es: "Comience registrando su primer cliente para activar el seguimiento de cartera.", en: "Start by registering your first customer to activate portfolio tracking." },
        networkSync: { es: "Sincronización de Red", en: "Network Sync" },
        currentStatus: { es: "Estado Actual", en: "Current Status" },
        totalRecords: { es: "Total Registros", en: "Total Records" },
        validatedContacts: { es: "Contactos Validados", en: "Validated Contacts" },
        activeLines: { es: "Líneas Activas", en: "Active Lines" },
        geoZones: { es: "Zonas Geo", en: "Geo Zones" },
        invalidDate: { es: "Fecha Inválida", en: "Invalid Date" },
        confirmDelete: { es: "¿Está seguro de que desea eliminar a {name}?", en: "Are you sure you want to delete {name}?" }
    },
    invoiceList: {
        title: { es: "FACTURAS DE VENTA", en: "SALES INVOICES" },
        newSale: { es: "NUEVA VENTA", en: "NEW SALE" },
        searchPlaceholder: { es: "Buscar por número o cliente...", en: "Search by number or customer..." },
        allStatuses: { es: "Todos los Estados", en: "All Statuses" },
        draft: { es: "Borrador", en: "Draft" },
        sent: { es: "Enviada", en: "Sent" },
        paid: { es: "Pagada", en: "Paid" },
        overdue: { es: "Vencida", en: "Overdue" },
        cancelled: { es: "Cancelada", en: "Cancelled" },
        unknownCustomer: { es: "Cliente desconocido", en: "Unknown Customer" },
        issueDate: { es: "Emisión", en: "Issued" },
        dueDate: { es: "Vence", en: "Due" },
        tax: { es: "Impuestos", en: "Tax" },
        created: { es: "Creada", en: "Created" },
        note: { es: "Nota", en: "Note" },
        viewInvoice: { es: "Ver Factura", en: "View Invoice" },
        generateIn: { es: "Generar en", en: "Generate in" },
        viewInventoryOutputs: { es: "Ver Salidas de Inventario", en: "View Inventory Outputs" },
        editInvoice: { es: "Editar Factura", en: "Edit Invoice" },
        deleteInvoice: { es: "Eliminar Factura", en: "Delete Invoice" },
        cannotDeletePaid: { es: "No se puede eliminar una factura pagada", en: "Cannot delete a paid invoice" },
        cannotDeletePaidAlert: { es: "No se puede eliminar una factura que ya está pagada.", en: "Cannot delete an invoice that is already paid." },
        confirmDelete: { es: "¿Está seguro de que desea eliminar la factura {number}?", en: "Are you sure you want to delete invoice {number}?" },
        overdueWarning: { es: "Vencida por {days} días", en: "Overdue by {days} days" },
        noInvoices: { es: "No hay facturas registradas", en: "No invoices registered" },
        noInvoicesMessage: { es: "Comience creando su primera factura de venta para registrar ingresos.", en: "Start by creating your first sales invoice to record revenue." },
        createInvoice: { es: "Crear Factura", en: "Create Invoice" },
        totalInvoices: { es: "Total Facturas", en: "Total Invoices" },
        totalAmount: { es: "Monto Total", en: "Total Amount" },
        paidCount: { es: "Facturas Pagadas", en: "Paid Invoices" },
        pendingAmount: { es: "Monto Pendiente", en: "Pending Amount" }
    },
    customerForm: {
        titleNew: { es: "REGISTRAR NUEVO CLIENTE", en: "REGISTER NEW CUSTOMER" },
        titleEdit: { es: "ACTUALIZAR DATOS", en: "UPDATE DATA" },
        protocol: { es: "Protocolo de Integridad de Datos v4.0", en: "Data Integrity Protocol v4.0" },
        close: { es: "Cerrar", en: "Close" },
        nameLabel: { es: "Identificador / Razón Social", en: "Identifier / Business Name" },
        namePlaceholder: { es: "EJ: CORPORACIÓN ALPHA", en: "EX: ALPHA CORPORATION" },
        nameError: { es: "Identificador mandatorio", en: "Identifier mandatory" },
        emailLabel: { es: "Protocolo de Enlace (Email)", en: "Link Protocol (Email)" },
        emailPlaceholder: { es: "contacto@empresa.com", en: "contact@company.com" },
        emailError: { es: "Email inválido", en: "Invalid email" },
        phoneLabel: { es: "Línea de Comunicación", en: "Communication Line" },
        phonePlaceholder: { es: "+1 (305) 555-0100", en: "+1 (305) 555-0100" },
        phoneError: { es: "Teléfono inválido", en: "Invalid phone" },
        countyLabel: { es: "Zona de Jurisdicción (Condado)", en: "Jurisdiction Zone (County)" },
        addressGroup: { es: "Dirección Física", en: "Physical Address" },
        address1Label: { es: "Calle y Número", en: "Street and Number" },
        address2Label: { es: "Apartamento / Unidad", en: "Apartment / Unit" },
        cityLabel: { es: "Ciudad", en: "City" },
        stateLabel: { es: "Estado", en: "State" },
        zipLabel: { es: "Código Postal", en: "Zip Code" },
        commercialGroup: { es: "Datos Comerciales", en: "Commercial Data" },
        creditLimit: { es: "Límite de Crédito", en: "Credit Limit" },
        paymentTerms: { es: "Términos de Pago (Días)", en: "Payment Terms (Days)" },
        taxExempt: { es: "Exento de Impuestos", en: "Tax Exempt" },
        notes: { es: "Notas Internas", en: "Internal Notes" },
        notesPlaceholder: { es: "Información adicional relevante...", en: "Additional relevant information..." },
        encryptionNotice: { es: "Los datos serán cifrados en el AuditChain inmutable.", en: "Data will be encrypted in the immutable AuditChain." },
        cancelButton: { es: "ABORDAR PROTOCOLO", en: "ABORT PROTOCOL" },
        submitCreate: { es: "SINCRONIZAR NUEVO CLIENTE", en: "SYNC NEW CUSTOMER" },
        submitUpdate: { es: "CONFIRMAR MODIFICACIÓN", en: "CONFIRM MODIFICATION" }
    },
    customerDetail: {
        personalInfo: { es: "Información Personal", en: "Personal Information" },
        contact: { es: "Contacto", en: "Contact" },
        primaryEmail: { es: "Email Principal", en: "Primary Email" },
        secondaryEmail: { es: "Email Secundario", en: "Secondary Email" },
        primaryPhone: { es: "Teléfono Principal", en: "Primary Phone" },
        secondaryPhone: { es: "Teléfono Secundario", en: "Secondary Phone" },
        address: { es: "Dirección", en: "Address" },
        county: { es: "Condado", en: "County" },
        commercialData: { es: "Datos Comerciales", en: "Commercial Data" },
        creditLimit: { es: "Límite de Crédito", en: "Credit Limit" },
        paymentTerms: { es: "Términos de Pago", en: "Payment Terms" },
        salesperson: { es: "Vendedor Asignado", en: "Assigned Salesperson" },
        taxExempt: { es: "Exento de Impuestos", en: "Tax Exempt" },
        customerInvoices: { es: "Facturas del Cliente", en: "Customer Invoices" },
        newInvoice: { es: "Nueva Factura", en: "New Invoice" },
        invoiceNumber: { es: "Número Factura", en: "Invoice Number" },
        dueDate: { es: "Vencimiento", en: "Due Date" },
        paymentHistory: { es: "Historial de Pagos", en: "Payment History" },
        registerPayment: { es: "Registrar Pago", en: "Register Payment" },
        paymentMethod: { es: "Método", en: "Method" },
        reference: { es: "Referencia", en: "Reference" },
        purchasedProducts: { es: "Productos Adquiridos", en: "Purchased Products" },
        lastPurchase: { es: "Última Compra", en: "Last Purchase" },
        totalPurchases: { es: "Total Compras", en: "Total Purchases" },
        totalAmount: { es: "Monto Total", en: "Total Amount" },
        viewMovements: { es: "Ver Movimientos", en: "View Movements" },
        noProducts: { es: "No hay productos adquiridos", en: "No purchased products" },
        editCustomer: { es: "Editar Cliente", en: "Edit Customer" },
        name: { es: "Nombre", en: "Name" },
        businessName: { es: "Razón Social", en: "Business Name" },
        document: { es: "Documento", en: "Document" },
        businessType: { es: "Tipo de Negocio", en: "Business Type" }
    },
    customerPayments: {
        title: { es: "Pagos de Clientes", en: "Customer Payments" },
        subtitle: { es: "Gestiona los pagos recibidos de clientes", en: "Manage payments received from customers" },
        searchPlaceholder: { es: "Buscar por cliente o número de factura...", en: "Search by customer or invoice number..." },
        pendingInvoices: { es: "Facturas Pendientes de Pago", en: "Invoices Pending Payment" },
        invoice: { es: "Factura", en: "Invoice" },
        daysOverdue: { es: "Días Vencido", en: "Days Overdue" },
        upToDate: { es: "Al día", en: "Up to date" },
        registerPayment: { es: "Registrar Pago", en: "Register Payment" },
        noInvoices: { es: "No hay facturas", en: "No invoices" },
        noPendingInvoices: { es: "No hay facturas pendientes de pago", en: "No invoices pending payment" },
        noFilteredInvoices: { es: "No se encontraron facturas con los filtros aplicados", en: "No invoices found with applied filters" },
        modalTitle: { es: "Registrar Pago", en: "Register Payment" },
        amountToPay: { es: "Monto del Pago", en: "Payment Amount" },
        paymentDate: { es: "Fecha de Pago", en: "Payment Date" },
        paymentMethod: { es: "Método de Pago", en: "Payment Method" },
        selectMethod: { es: "Seleccionar método...", en: "Select method..." },
        noMethods: { es: "No hay métodos de pago configurados.", en: "No payment methods configured." },
        referenceNumber: { es: "Referencia/Número", en: "Reference/Number" },
        referencePlaceholder: { es: "Número de cheque, referencia, etc.", en: "Check number, reference, etc." },
        notes: { es: "Notas (Opcional)", en: "Notes (Optional)" },
        notesPlaceholder: { es: "Notas adicionales sobre el pago...", en: "Additional notes on payment..." },
        processing: { es: "Procesando...", en: "Processing..." }
    },
    invoiceForm: {
        customer: { es: "Cliente", en: "Customer" },
        selectCustomer: { es: "Seleccionar Cliente", en: "Select Customer" },
        errorCustomer: { es: "Debe seleccionar un cliente", en: "Must select a customer" },
        issueDate: { es: "Fecha de Emisión", en: "Issue Date" },
        errorIssueDate: { es: "Fecha de emisión requerida", en: "Issue date required" },
        dueDate: { es: "Fecha de Vencimiento", en: "Due Date" },
        errorDueDate: { es: "Fecha de vencimiento requerida", en: "Due date required" },
        errorDateOrder: { es: "La fecha de vencimiento debe ser posterior a la de emisión", en: "Due date must be after issue date" },
        customerInfo: { es: "Información del Cliente", en: "Customer Information" },
        items: { es: "Ítems de la Factura", en: "Invoice Items" },
        addItem: { es: "Agregar Ítem", en: "Add Item" },
        product: { es: "PRODUCTO", en: "PRODUCT" },
        selectProduct: { es: "Seleccionar Producto", en: "Select Product" },
        description: { es: "DESCRIPCIÓN", en: "DESCRIPTION" },
        errorDescription: { es: "Descripción requerida", en: "Description required" },
        quantity: { es: "CANTIDAD", en: "QUANTITY" },
        errorQuantity: { es: "Cantidad inválida", en: "Invalid quantity" },
        unitPrice: { es: "PRECIO UNIT.", en: "UNIT PRICE" },
        errorUnitPrice: { es: "Precio inválido", en: "Invalid price" },
        taxable: { es: "IMPUESTO", en: "TAX" },
        lineTotal: { es: "Total Línea", en: "Line Total" },
        summary: { es: "Resumen", en: "Summary" },
        subtotal: { es: "Subtotal", en: "Subtotal" },
        createInvoice: { es: "Crear Factura", en: "Create Invoice" },
        updateInvoice: { es: "Actualizar Factura", en: "Update Invoice" }
    },
    invoiceDetail: {
        overdueAlertTitle: { es: "Factura Vencida", en: "Overdue Invoice" },
        overdueAlertMessage: { es: "Esta factura está vencida por {days} días. Por favor, comuníquese con el cliente para el pago.", en: "This invoice is overdue by {days} days. Please contact the customer for payment." },
        paidAlertTitle: { es: "Factura Pagada", en: "Invoice Paid" },
        paidAlertMessage: { es: "Esta factura ha sido marcada como pagada. ¡Gracias por su negocio!", en: "This invoice has been marked as paid. Thank you for your business!" }
    }
};

// Apply updates
Object.keys(newKeys).forEach(section => {
    if (!esData[section]) esData[section] = {};
    if (!enData[section]) enData[section] = {};

    Object.keys(newKeys[section]).forEach(key => {
        esData[section][key] = newKeys[section][key].es;
        enData[section][key] = newKeys[section][key].en;
    });
});

writeJson(esPath, esData);
writeJson(enPath, enData);
