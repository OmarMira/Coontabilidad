
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "invoiceList.paid": "Pagada",
    "invoiceList.sent": "Enviada",
    "invoiceList.overdue": "Vencida",
    "invoiceList.draft": "Borrador",
    "invoiceList.partial": "Parcial",
    "common.days": "{n} días",
    "common.paid": "Pagada",
    "common.pending": "Pendiente",
    "paymentMethods.credit_card": "Tarjeta de Crédito",
    "paymentMethods.bank_transfer": "Transferencia Bancaria",
    "customerForm.docSSN": "SSN - Número de Seguro Social",
    "customerForm.docEIN": "EIN - Número de Identificación Patronal",
    "customerForm.docITIN": "ITIN - ID de Contribuyente Individual",
    "customerForm.docPassport": "Pasaporte",
    "customerForm.placeholderEmail": "ejemplo@email.com",
    "customerForm.placeholderSecondaryEmail": "secundario@email.com",
    "customerForm.placeholderAddress1": "1234 Calle Principal",
    "customerForm.placeholderAddress2": "Apto 101, Suite 200, etc.",
    "customerForm.placeholderCity": "Miami",
    "customerForm.placeholderZip": "33101",
    "customerForm.placeholderTaxId": "12-3456789",
    "customerForm.autoCompleteHelpExtended": "Busca por ciudad, estado o código postal. Incluye más de 400 ciudades principales de Estados Unidos. Usa APIs gratuitas de OpenStreetMap para sugerir direcciones adicionales."
};

const enUpdates = {
    "invoiceList.paid": "Paid",
    "invoiceList.sent": "Sent",
    "invoiceList.overdue": "Overdue",
    "invoiceList.draft": "Draft",
    "invoiceList.partial": "Partial",
    "common.days": "{n} days",
    "common.paid": "Paid",
    "common.pending": "Pending",
    "paymentMethods.credit_card": "Credit Card",
    "paymentMethods.bank_transfer": "Bank Transfer",
    "customerForm.docSSN": "SSN - Social Security Number",
    "customerForm.docEIN": "EIN - Employer Identification Number",
    "customerForm.docITIN": "ITIN - Individual Taxpayer ID",
    "customerForm.docPassport": "Passport",
    "customerForm.placeholderEmail": "example@email.com",
    "customerForm.placeholderSecondaryEmail": "secondary@email.com",
    "customerForm.placeholderAddress1": "1234 Main Street",
    "customerForm.placeholderAddress2": "Apt 101, Suite 200, etc.",
    "customerForm.placeholderCity": "Miami",
    "customerForm.placeholderZip": "33101",
    "customerForm.placeholderTaxId": "12-3456789",
    "customerForm.autoCompleteHelpExtended": "Search by city, state, or zip code. Includes over 400 major US cities. Uses free OpenStreetMap APIs for additional address suggestions."
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
