
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "system.initializing": "Inicializando...",
    "system.verifyingCompatibility": "Verificando compatibilidad...",
    "system.requestingStorage": "Solicitando almacenamiento persistente...",
    "system.configuringSQLite": "Configurando Motor SQLite...",
    "system.loadingData": "Cargando datos maestros...",
    "system.configuringBackups": "Configurando respaldos automáticos...",
    "system.startingAnomalyDetection": "Iniciando detección de anomalías IA...",
    "system.initSuccess": "Sistemas listos para operación",
    "system.completed": "Completado",
    "system.error": "Fallo del sistema",

    "messages.confirmDelete": "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
    "messages.confirmDeleteCustomer": "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.",
    "messages.confirmDeleteSupplier": "¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.",
    "messages.confirmDeleteInvoice": "¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.",
    "messages.confirmDeleteBill": "¿Estás seguro de que deseas eliminar esta factura de compra? Esta acción no se puede deshacer.",
    "messages.confirmDeleteProduct": "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.",

    "messages.customerAdded": "Cliente \"{name}\" agregado correctamente",
    "messages.supplierAdded": "Proveedor \"{name}\" agregado correctamente",
    "messages.invoiceCreated": "Factura creada correctamente",
    "messages.billSaved": "Factura de compra guardada correctamente",
    "messages.productCreated": "Producto creado correctamente",
    "messages.categoryCreated": "Categoría creada correctamente",
    "messages.quoteCreated": "Cotización creada correctamente",
    "messages.quoteConverted": "Cotización convertida a factura correctamente",
    "messages.bankAccountCreated": "Cuenta bancaria creada correctamente",
    "messages.entryRegistered": "Asiento contable registrado correctamente",
    "messages.clientPaymentSuccess": "Pago de cliente registrado correctamente",
    "messages.supplierPaymentSuccess": "Pago a proveedor registrado correctamente",

    "messages.errorLoading": "Error al cargar los datos",
    "messages.errorAdding": "Error al agregar",
    "messages.errorUpdating": "Error al actualizar",
    "messages.errorDeleting": "Error al eliminar",
    "messages.dbNotReady": "La base de datos no está lista. Por favor recarga la página.",
    "messages.systemInitializing": "El sistema aún se está inicializando. Por favor espera un momento.",

    "forms.newCustomer": "Nuevo Cliente",
    "forms.editCustomer": "Editar Cliente",
    "forms.newSupplier": "Nuevo Proveedor",
    "forms.editSupplier": "Editar Proveedor",
    "forms.newInvoice": "Nueva Factura",
    "forms.editInvoice": "Editar Factura",
    "forms.newBill": "Nueva Factura de Compra",
    "forms.editBill": "Editar Factura de Compra",
    "forms.newProduct": "Nuevo Producto",
    "forms.editProduct": "Editar Producto",
    "forms.newCategory": "Nueva Categoría",
    "forms.editCategory": "Editar Categoría",
    "forms.newQuote": "Nueva Cotización",
    "forms.editQuote": "Editar Cotización",
    "forms.newBankAccount": "Nueva Cuenta Bancaria",
    "forms.editBankAccount": "Editar Cuenta Bancaria",

    "sections.quotes": "Cotizaciones",
    "demoMode.banner": "MODO DEMO ACTIVO - LOS DATOS SON VOLÁTILES"
};

const enUpdates = {
    "system.initializing": "Initializing...",
    "system.verifyingCompatibility": "Verifying compatibility...",
    "system.requestingStorage": "Requesting persistent storage...",
    "system.configuringSQLite": "Configuring SQLite Engine...",
    "system.loadingData": "Loading master data...",
    "system.configuringBackups": "Configuring automatic backups...",
    "system.startingAnomalyDetection": "Starting AI anomaly detection...",
    "system.initSuccess": "Systems ready for operation",
    "system.completed": "Completed",
    "system.error": "System failure",

    "messages.confirmDelete": "Are you sure you want to delete this item? This action cannot be undone.",
    "messages.confirmDeleteCustomer": "Are you sure you want to delete this customer? This action cannot be undone.",
    "messages.confirmDeleteSupplier": "Are you sure you want to delete this supplier? This action cannot be undone.",
    "messages.confirmDeleteInvoice": "Are you sure you want to delete this invoice? This action cannot be undone.",
    "messages.confirmDeleteBill": "Are you sure you want to delete this purchase bill? This action cannot be undone.",
    "messages.confirmDeleteProduct": "Are you sure you want to delete this product? This action cannot be undone.",

    "messages.customerAdded": "Customer \"{name}\" added successfully",
    "messages.supplierAdded": "Supplier \"{name}\" added successfully",
    "messages.invoiceCreated": "Invoice created successfully",
    "messages.billSaved": "Purchase bill saved successfully",
    "messages.productCreated": "Product created successfully",
    "messages.categoryCreated": "Category created successfully",
    "messages.quoteCreated": "Quote created successfully",
    "messages.quoteConverted": "Quote converted to invoice successfully",
    "messages.bankAccountCreated": "Bank account created successfully",
    "messages.entryRegistered": "Journal entry registered successfully",
    "messages.clientPaymentSuccess": "Customer payment registered successfully",
    "messages.supplierPaymentSuccess": "Supplier payment registered successfully",

    "messages.errorLoading": "Error loading data",
    "messages.errorAdding": "Error adding",
    "messages.errorUpdating": "Error updating",
    "messages.errorDeleting": "Error deleting",
    "messages.dbNotReady": "Database is not ready. Please reload the page.",
    "messages.systemInitializing": "System is still initializing. Please wait a moment.",

    "forms.newCustomer": "New Customer",
    "forms.editCustomer": "Edit Customer",
    "forms.newSupplier": "New Supplier",
    "forms.editSupplier": "Edit Supplier",
    "forms.newInvoice": "New Invoice",
    "forms.editInvoice": "Edit Invoice",
    "forms.newBill": "New Purchase Bill",
    "forms.editBill": "Edit Purchase Bill",
    "forms.newProduct": "New Product",
    "forms.editProduct": "Edit Product",
    "forms.newCategory": "New Category",
    "forms.editCategory": "Edit Category",
    "forms.newQuote": "New Quote",
    "forms.editQuote": "Edit Quote",
    "forms.newBankAccount": "New Bank Account",
    "forms.editBankAccount": "Edit Bank Account",

    "sections.quotes": "Quotes",
    "demoMode.banner": "DEMO MODE ACTIVE - DATA IS VOLATILE"
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
