const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    // ==================== PAYMENT METHODS  (Métodos de Pago) - COMPLETE ====================
    "paymentMethods.title": "Métodos de Pago",
    "paymentMethods.subtitle": "Gestiona las opciones de cobro y pago disponibles",
    "paymentMethods.newMethod": "Nuevo Método",
    "paymentMethods.addMethod": "Agregar Método",
    "paymentMethods.noMethods": "No hay registros",
    "paymentMethods.noMethodsDesc": "Comienza configurando tu primer método de cobro.",
    "paymentMethods.activeConfigurations": "Configuraciones Activas  ",
    "paymentMethods.registeredMethods": "métodos de pago registrados en el motor",
    "paymentMethods.requiresReference": "Requiere Referencia",
    "paymentMethods.confirmDelete": "¿Estás seguro de que deseas eliminar el método de pago",

    // Form
    "paymentMethods.form.titleNew": "Nuevo Método de Pago",
    "paymentMethods.form.titleEdit": "Actualizar Método",
    "paymentMethods.form.subtitle": "Configura las reglas de validación para esta vía de pago",
    "paymentMethods.form.name": "Nombre Descriptivo",
    "paymentMethods.form.namePlaceholder": "Ej: Transferencia Zelle, Efectivo USD...",
    "paymentMethods.form.type": "Tipo de Transacción",
    "paymentMethods.form.enabled": "Habilitado",
    "paymentMethods.form.requiresRef": "Referencia Oblig.",
    "paymentMethods.form.confirm": "Confirmar Registro",

    // Types
    "paymentMethods.type.cash": "Efectivo",
    "paymentMethods.type.check": "Cheque",
    "paymentMethods.type.creditCard": "Tarjeta de Crédito",
    "paymentMethods.type.bankTransfer": "Transferencia Bancaria",
    "paymentMethods.type.other": "Otro",

    // Errors
    "paymentMethods.error.load": "Error al cargar los métodos de pago",
    "paymentMethods.error.save": "Error al guardar el método de pago",
    "paymentMethods.error.delete": "Error al eliminar el método de pago",
    "paymentMethods.error.cannotDelete": "No se puede eliminar el método de pago",

    // Common labels (if not already exist)
    "common.inactive": "Inactivo",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.discard": "Descartar",
    "common.saving": "Guardando...",
    "common.saveChanges": "Guardar Cambios"
};

const enUpdates = {
    // ==================== PAYMENT METHODS - COMPLETE ====================
    "paymentMethods.title": "Payment Methods",
    "paymentMethods.subtitle": "Manage available payment and collection options",
    "paymentMethods.newMethod": "New Method",
    "paymentMethods.addMethod": "Add Method",
    "paymentMethods.noMethods": "No records",
    "paymentMethods.noMethodsDesc": "Start by configuring your first payment method.",
    "paymentMethods.activeConfigurations": "Active Configurations",
    "paymentMethods.registeredMethods": "payment methods registered in the system",
    "paymentMethods.requiresReference": "Requires Reference",
    "paymentMethods.confirmDelete": "Are you sure you want to delete the payment method",

    // Form
    "paymentMethods.form.titleNew": "New Payment Method",
    "paymentMethods.form.titleEdit": "Update Method",
    "paymentMethods.form.subtitle": "Configure the validation rules for this payment method",
    "paymentMethods.form.name": "Display Name",
    "paymentMethods.form.namePlaceholder": "E.g: Zelle Transfer, Cash USD...",
    "paymentMethods.form.type": "Transaction Type",
    "paymentMethods.form.enabled": "Enabled",
    "paymentMethods.form.requiresRef": "Ref. Required",
    "paymentMethods.form.confirm": "Confirm Registration",

    // Types
    "paymentMethods.type.cash": "Cash",
    "paymentMethods.type.check": "Check",
    "paymentMethods.type.creditCard": "Credit Card",
    "paymentMethods.type.bankTransfer": "Bank Transfer",
    "paymentMethods.type.other": "Other",

    // Errors
    "paymentMethods.error.load": "Error loading payment methods",
    "paymentMethods.error.save": "Error saving payment method",
    "paymentMethods.error.delete": "Error deleting payment method",
    "paymentMethods.error.cannotDelete": "Cannot delete payment method",

    // Common labels (if not already exist)
    "common.inactive": "Inactive",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.discard": "Discard",
    "common.saving": "Saving...",
    "common.saveChanges": "Save Changes"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file}   with ${Object.keys(updates).length} keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);
