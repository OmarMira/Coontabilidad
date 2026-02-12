
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "common.previous": "Anterior",
    "common.next": "Siguiente",
    "common.create": "Crear",
    "common.update": "Actualizar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.requiredField": "Requerido",
    "common.invalidEmail": "Email inválido",
    "common.invalidPhone": "Teléfono inválido",
    "common.invalidZip": "Código postal inválido",

    "customerForm.titleNew": "Nuevo Cliente",
    "customerForm.titleEdit": "Editar Cliente",
    "customerForm.fullName": "Nombre Completo / Razón Social *",
    "customerForm.fullNamePlaceholder": "Ej: Juan Pérez o Acme Corp LLC",
    "customerForm.businessName": "Nombre Comercial",
    "customerForm.businessNamePlaceholder": "Nombre comercial o DBA",
    "customerForm.documentType": "Tipo de Documento",
    "customerForm.documentNumber": "Número de Documento",
    "customerForm.documentNumberPlaceholder": "123-45-6789 o 12-3456789",
    "customerForm.businessActivity": "Tipo de Negocio / Actividad",
    "customerForm.businessActivityPlaceholder": "Ej: Desarrollo de Software, Consultoría, Retail",
    "customerForm.primaryEmail": "Email Principal",
    "customerForm.secondaryEmail": "Email Secundario",
    "customerForm.primaryPhone": "Teléfono Principal",
    "customerForm.secondaryPhone": "Teléfono Secundario",
    "customerForm.addressLine1": "Dirección Línea 1 *",
    "customerForm.addressLine2": "Dirección Línea 2",
    "customerForm.city": "Ciudad *",
    "customerForm.state": "Estado *",
    "customerForm.zipCode": "Código Postal *",
    "customerForm.county": "Condado de Florida *",
    "customerForm.countyHelp": "Requerido para el cálculo correcto de impuestos de Florida",
    "customerForm.creditLimit": "Límite de Crédito ($)",
    "customerForm.paymentTerms": "Términos de Pago (días)",
    "customerForm.immediatePayment": "Pago inmediato",
    "customerForm.days": "{n} días",
    "customerForm.taxId": "Tax ID / Número de Impuestos",
    "customerForm.salesperson": "Vendedor Asignado",
    "customerForm.unassigned": "Sin asignar",
    "customerForm.status": "Estado del Cliente",
    "customerForm.taxExempt": "Exento de Impuestos",
    "customerForm.notes": "Notas Adicionales",
    "customerForm.notesPlaceholder": "Notas adicionales sobre el cliente...",
    "customerForm.autoCompleteTitle": "🌟 Autocompletado de Direcciones",
    "customerForm.autoCompleteHelp": "Busca por ciudad, estado o código postal. Incluye más de 400 ciudades principales de Estados Unidos.",
    "customerForm.autoCompletePlaceholder": "Empiece a escribir una dirección...",
    "customerForm.autoCompleteTip": "💡 Tip: Escribe al menos 2 caracteres. Funciona con ciudades, estados y códigos postales de todo Estados Unidos",
    "customerForm.zipCodeTip": "💡 Tip: Al escribir un código postal de 5 dígitos, se completarán automáticamente ciudad y estado",
    "customerForm.errorName": "El nombre es requerido",
    "customerForm.errorInvalidZip": "Código postal inválido (formato: 12345 o 12345-6789)",
    "customerForm.infoTitle": "ℹ️ Autocompletado de Direcciones",
    "customerForm.infoItem1": "Funciona con 2+ caracteres: Escribe ciudad, estado o código postal",
    "customerForm.infoItem2": "Cobertura nacional: Más de 400 ciudades principales de Estados Unidos",
    "customerForm.infoItem3": "APIs gratuitas: Usa OpenStreetMap Nominatim (sin costos recurrentes)",
    "customerForm.infoItem4": "Ejemplos: \"Miami\", \"NY\", \"90210\", \"Chicago\", \"Los Angeles\"",
    "customerForm.infoItem5": "Florida: El condado se selecciona automáticamente cuando es posible",
    "customerForm.updateCustomer": "Actualizar Cliente",
    "customerForm.createCustomer": "Crear Cliente"
};

const enUpdates = {
    "common.previous": "Previous",
    "common.next": "Next",
    "common.create": "Create",
    "common.update": "Update",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.requiredField": "Required",
    "common.invalidEmail": "Invalid email",
    "common.invalidPhone": "Invalid phone",
    "common.invalidZip": "Invalid zip code",

    "customerForm.titleNew": "New Customer",
    "customerForm.titleEdit": "Edit Customer",
    "customerForm.fullName": "Full Name / Legal Name *",
    "customerForm.fullNamePlaceholder": "e.g., John Doe or Acme Corp LLC",
    "customerForm.businessName": "Trade Name",
    "customerForm.businessNamePlaceholder": "Trade name or DBA",
    "customerForm.documentType": "Document Type",
    "customerForm.documentNumber": "Document Number",
    "customerForm.documentNumberPlaceholder": "123-45-6789 or 12-3456789",
    "customerForm.businessActivity": "Business Type / Activity",
    "customerForm.businessActivityPlaceholder": "e.g., Software Development, Consulting, Retail",
    "customerForm.primaryEmail": "Primary Email",
    "customerForm.secondaryEmail": "Secondary Email",
    "customerForm.primaryPhone": "Primary Phone",
    "customerForm.secondaryPhone": "Secondary Phone",
    "customerForm.addressLine1": "Address Line 1 *",
    "customerForm.addressLine2": "Address Line 2",
    "customerForm.city": "City *",
    "customerForm.state": "State *",
    "customerForm.zipCode": "ZIP Code *",
    "customerForm.county": "Florida County *",
    "customerForm.countyHelp": "Required for correct Florida tax calculation",
    "customerForm.creditLimit": "Credit Limit ($)",
    "customerForm.paymentTerms": "Payment Terms (days)",
    "customerForm.immediatePayment": "Immediate payment",
    "customerForm.days": "{n} days",
    "customerForm.taxId": "Tax ID / Tax Number",
    "customerForm.salesperson": "Assigned Salesperson",
    "customerForm.unassigned": "Unassigned",
    "customerForm.status": "Customer Status",
    "customerForm.taxExempt": "Tax Exempt",
    "customerForm.notes": "Additional Notes",
    "customerForm.notesPlaceholder": "Additional notes about the customer...",
    "customerForm.autoCompleteTitle": "🌟 Address Autocomplete",
    "customerForm.autoCompleteHelp": "Search by city, state, or zip code. Includes over 400 major US cities.",
    "customerForm.autoCompletePlaceholder": "Start typing an address...",
    "customerForm.autoCompleteTip": "💡 Tip: Type at least 2 characters. Works for cities, states, and zip codes across the US",
    "customerForm.zipCodeTip": "💡 Tip: When typing a 5-digit zip code, city and state will be filled automatically",
    "customerForm.errorName": "Name is required",
    "customerForm.errorInvalidZip": "Invalid zip code (format: 12345 or 12345-6789)",
    "customerForm.infoTitle": "ℹ️ Address Autocomplete",
    "customerForm.infoItem1": "Works with 2+ characters: Type city, state, or zip code",
    "customerForm.infoItem2": "National coverage: Over 400 major US cities",
    "customerForm.infoItem3": "Free APIs: Uses OpenStreetMap Nominatim (no recurring costs)",
    "customerForm.infoItem4": "Examples: \"Miami\", \"NY\", \"90210\", \"Chicago\", \"Los Angeles\"",
    "customerForm.infoItem5": "Florida: County is automatically selected when possible",
    "customerForm.updateCustomer": "Update Customer",
    "customerForm.createCustomer": "Create Customer"
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
