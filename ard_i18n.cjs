
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "ard.title": "ARD: Análisis de Recibos y Documentos",
    "ard.subtitle": "Motor inteligente de procesamiento de documentos y conversión automática.",
    "ard.scanning": "DIGITALIZACIÓN",
    "ard.garManagement": "GESTIÓN GAR",
    "ard.inventory": "INVENTARIO",
    "ard.collections": "COBROS",
    "ard.customers": "CLIENTES",
    "ard.quality": "CALIDAD",
    "ard.roadmap": "HOJA RUTA",
    "ard.enProceso": "En Proceso",
    "ard.analizados": "Analizados",
    "ard.errores": "Errores",
    "ard.convertidos": "Convertidos",
    "ard.smartDigitalization": "Digitalización Inteligente",
    "ard.dropFilesHint": "Arrastre sus recibos, facturas o capturas de pantalla aquí para procesarlos instantáneamente.",
    "ard.analyzingDoc": "Analizando Documento...",
    "ard.visionEngineProgress": "Nuestro motor de visión está extrayendo montos e impuestos. Por favor espere.",
    "ard.activeIAOCR": "Motor OCR IA Activo",
    "ard.selectFile": "Seleccionar Archivo",
    "ard.confirmDeleteAnalysis": "¿Desea eliminar este registro de análisis?",
    "ard.analyzing": "ANALIZANDO",
    "ard.processed": "PROCESADO",
    "ard.converted": "CONVERTIDO",
    "ard.garHistory": "Historial de Gestión GAR",
    "ard.numDocuments": "{count} DOCUMENTOS",
    "ard.documentCol": "Documento",
    "ard.statusCol": "Estado",
    "ard.amountCol": "Monto Detectado",
    "ard.dateCol": "Fecha",
    "ard.actionsCol": "Acciones",
    "ard.viewAIAnalysis": "Ver Análisis IA",
    "ard.assignCustomer": "Asignar Cliente",
    "ard.customerAssigned": "Cliente Asignado",
    "ard.convertToInvoice": "Convertir a Factura/Venta",
    "ard.convertToDirectPayment": "Convertir a Cobro Directo",
    "ard.noGarRecords": "No hay registros en el gestor GAR",
    "ard.faseStatus": "Módulo ARD Fase 4 (COMPLETA) - Iniciando Fase 5: Integración Multi-Módulo",
    "ard.engineReady": "Motor AccountExpress Listo"
};

const enUpdates = {
    "ard.title": "ARD: Receipt & Document Analysis",
    "ard.subtitle": "Intelligent document processing and automatic conversion engine.",
    "ard.scanning": "DIGITIZATION",
    "ard.garManagement": "GAR MANAGEMENT",
    "ard.inventory": "INVENTORY",
    "ard.collections": "COLLECTIONS",
    "ard.customers": "CUSTOMERS",
    "ard.quality": "QUALITY",
    "ard.roadmap": "ROADMAP",
    "ard.enProceso": "In Process",
    "ard.analizados": "Analyzed",
    "ard.errores": "Errors",
    "ard.convertidos": "Converted",
    "ard.smartDigitalization": "Smart Digitization",
    "ard.dropFilesHint": "Drop your receipts, invoices or screenshots here to process them instantly.",
    "ard.analyzingDoc": "Analyzing Document...",
    "ard.visionEngineProgress": "Our vision engine is extracting amounts and taxes. Please wait.",
    "ard.activeIAOCR": "AI OCR Engine Active",
    "ard.selectFile": "Select File",
    "ard.confirmDeleteAnalysis": "Do you want to delete this analysis record?",
    "ard.analyzing": "ANALYZING",
    "ard.processed": "PROCESSED",
    "ard.converted": "CONVERTED",
    "ard.garHistory": "GAR Management History",
    "ard.numDocuments": "{count} DOCUMENTS",
    "ard.documentCol": "Document",
    "ard.statusCol": "Status",
    "ard.amountCol": "Detected Amount",
    "ard.dateCol": "Date",
    "ard.actionsCol": "Actions",
    "ard.viewAIAnalysis": "View AI Analysis",
    "ard.assignCustomer": "Assign Customer",
    "ard.customerAssigned": "Customer Assigned",
    "ard.convertToInvoice": "Convert to Invoice/Sale",
    "ard.convertToDirectPayment": "Convert to Direct Payment",
    "ard.noGarRecords": "No records in the GAR manager",
    "ard.faseStatus": "ARD Module Phase 4 (COMPLETE) - Starting Phase 5: Multi-Module Integration",
    "ard.engineReady": "AccountExpress Engine Ready"
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
