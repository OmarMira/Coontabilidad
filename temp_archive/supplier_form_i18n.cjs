
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "supplierForm.titleNew": "Nuevo Proveedor",
    "supplierForm.titleEdit": "Editar Proveedor",
    "supplierForm.info": "Información del Proveedor",
    "supplierForm.name": "Nombre del Proveedor / Razón Social *",
    "supplierForm.namePlaceholder": "Ej: Tech Solutions Inc o ABC Corp LLC",
    "supplierForm.businessName": "Nombre Comercial",
    "supplierForm.businessNamePlaceholder": "Nombre comercial o DBA",
    "supplierForm.documentType": "Tipo de Documento",
    "supplierForm.documentNumber": "Número de Documento",
    "supplierForm.documentNumberPlaceholder": "12-3456789 o 123-45-6789",
    "supplierForm.businessActivity": "Tipo de Negocio / Actividad",
    "supplierForm.businessActivityPlaceholder": "Ej: Suministros de Oficina, Tecnología, Servicios Profesionales",
    "supplierForm.primaryEmail": "Email Principal",
    "supplierForm.secondaryEmail": "Email Secundario",
    "supplierForm.primaryPhone": "Teléfono Principal",
    "supplierForm.secondaryPhone": "Teléfono Secundario",
    "supplierForm.addressLine1": "Dirección Línea 1 *",
    "supplierForm.addressLine2": "Dirección Línea 2",
    "supplierForm.city": "Ciudad *",
    "supplierForm.state": "Estado *",
    "supplierForm.zipCode": "Código Postal *",
    "supplierForm.county": "Condado de Florida *",
    "supplierForm.countyHelp": "Requerido para el cálculo correcto de impuestos de Florida",
    "supplierForm.creditLimit": "Límite de Crédito ($)",
    "supplierForm.paymentTerms": "Términos de Pago (días)",
    "supplierForm.taxId": "Tax ID / Número de Impuestos",
    "supplierForm.assignedBuyer": "Comprador Asignado",
    "supplierForm.status": "Estado del Proveedor",
    "supplierForm.taxExempt": "Exento de Impuestos",
    "supplierForm.notes": "Notas Adicionales",
    "supplierForm.notesPlaceholder": "Notas adicionales sobre el proveedor...",
    "supplierForm.updateSupplier": "Actualizar Proveedor",
    "supplierForm.createSupplier": "Crear Proveedor"
};

const enUpdates = {
    "supplierForm.titleNew": "New Supplier",
    "supplierForm.titleEdit": "Edit Supplier",
    "supplierForm.info": "Supplier Information",
    "supplierForm.name": "Supplier Name / Legal Name *",
    "supplierForm.namePlaceholder": "e.g., Tech Solutions Inc or ABC Corp LLC",
    "supplierForm.businessName": "Trade Name",
    "supplierForm.businessNamePlaceholder": "Trade name or DBA",
    "supplierForm.documentType": "Document Type",
    "supplierForm.documentNumber": "Document Number",
    "supplierForm.documentNumberPlaceholder": "12-3456789 or 123-45-6789",
    "supplierForm.businessActivity": "Business Type / Activity",
    "supplierForm.businessActivityPlaceholder": "e.g., Office Supplies, Technology, Professional Services",
    "supplierForm.primaryEmail": "Primary Email",
    "supplierForm.secondaryEmail": "Secondary Email",
    "supplierForm.primaryPhone": "Primary Phone",
    "supplierForm.secondaryPhone": "Secondary Phone",
    "supplierForm.addressLine1": "Address Line 1 *",
    "supplierForm.addressLine2": "Address Line 2",
    "supplierForm.city": "City *",
    "supplierForm.state": "State *",
    "supplierForm.zipCode": "ZIP Code *",
    "supplierForm.county": "Florida County *",
    "supplierForm.countyHelp": "Required for correct Florida tax calculation",
    "supplierForm.creditLimit": "Credit Limit ($)",
    "supplierForm.paymentTerms": "Payment Terms (days)",
    "supplierForm.taxId": "Tax ID / Tax Number",
    "supplierForm.assignedBuyer": "Assigned Buyer",
    "supplierForm.status": "Supplier Status",
    "supplierForm.taxExempt": "Tax Exempt",
    "supplierForm.notes": "Additional Notes",
    "supplierForm.notesPlaceholder": "Additional notes about the supplier...",
    "supplierForm.updateSupplier": "Update Supplier",
    "supplierForm.createSupplier": "Create Supplier"
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
