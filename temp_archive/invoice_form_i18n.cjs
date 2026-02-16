
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "invoiceForm.customer": "Cliente *",
    "invoiceForm.selectCustomer": "Seleccione un cliente",
    "invoiceForm.issueDate": "Fecha de Emisión *",
    "invoiceForm.dueDate": "Fecha de Vencimiento *",
    "invoiceForm.customerInfo": "Información del Cliente",
    "invoiceForm.items": "Ítems de la Factura",
    "invoiceForm.addItem": "Agregar Ítem",
    "invoiceForm.product": "Producto (Opcional)",
    "invoiceForm.selectProduct": "Seleccione un producto",
    "invoiceForm.description": "Descripción *",
    "invoiceForm.quantity": "Cantidad *",
    "invoiceForm.unitPrice": "Precio Unitario *",
    "invoiceForm.taxable": "Gravable",
    "invoiceForm.tax": "Impuesto",
    "invoiceForm.lineTotal": "Total Línea",
    "invoiceForm.summary": "Resumen de Factura",
    "invoiceForm.subtotal": "Subtotal",
    "invoiceForm.updateInvoice": "Actualizar Factura",
    "invoiceForm.createInvoice": "Crear Factura",
    "invoiceForm.errorCustomer": "El cliente es requerido",
    "invoiceForm.errorIssueDate": "La fecha de emisión es requerida",
    "invoiceForm.errorDueDate": "La fecha de vencimiento es requerida",
    "invoiceForm.errorDateOrder": "La fecha de vencimiento debe ser posterior a la de emisión",
    "invoiceForm.errorDescription": "La descripción es requerida",
    "invoiceForm.errorQuantity": "La cantidad debe ser mayor a 0",
    "invoiceForm.errorUnitPrice": "El precio unitario no puede ser negativo"
};

const enUpdates = {
    "invoiceForm.customer": "Customer *",
    "invoiceForm.selectCustomer": "Select Customer",
    "invoiceForm.issueDate": "Issue Date *",
    "invoiceForm.dueDate": "Due Date *",
    "invoiceForm.customerInfo": "Customer Information",
    "invoiceForm.items": "Invoice Items",
    "invoiceForm.addItem": "Add Item",
    "invoiceForm.product": "Product (Optional)",
    "invoiceForm.selectProduct": "Select Product",
    "invoiceForm.description": "Description *",
    "invoiceForm.quantity": "Quantity *",
    "invoiceForm.unitPrice": "Unit Price *",
    "invoiceForm.taxable": "Taxable",
    "invoiceForm.tax": "Tax",
    "invoiceForm.lineTotal": "Line Total",
    "invoiceForm.summary": "Invoice Summary",
    "invoiceForm.subtotal": "Subtotal",
    "invoiceForm.updateInvoice": "Update Invoice",
    "invoiceForm.createInvoice": "Create Invoice",
    "invoiceForm.errorCustomer": "Customer is required",
    "invoiceForm.errorIssueDate": "Issue date is required",
    "invoiceForm.errorDueDate": "Due date is required",
    "invoiceForm.errorDateOrder": "Due date must be after issue date",
    "invoiceForm.errorDescription": "Description is required",
    "invoiceForm.errorQuantity": "Quantity must be greater than 0",
    "invoiceForm.errorUnitPrice": "Unit price cannot be negative"
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
