const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'src/assets/locales/es.json');
const enPath = path.join(__dirname, 'src/assets/locales/en.json');

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeys = {
    "closure": {
        "checklist": {
            "title": "Checklist de Validaciones",
            "passed": "PASADAS",
            "warnings": "ALERTAS",
            "errors": "ERRORES",
            "pending": "PENDIENTES",
            "validating": "Validando...",
            "runValidations": "Ejecutar Validaciones",
            "technicalAudit": "Auditoría Técnica",
            "stepStatus": "Estado Final del Paso",
            "completedValidations": "validaciones completadas",
            "errorActionRequired": "ERROR: ACCIÓN REQUERIDA",
            "warningsDetected": "ADVERTENCIAS DETECTADAS",
            "readyToContinue": "LISTO PARA CONTINUAR",
            "auditRecorded": "Resultados registrados en la auditoría inmutable"
        },
        "report": {
            "title": "Reporte de Cierre",
            "periodDetails": "Detalles del Período",
            "status": "Estado",
            "closedLocked": "CERRADO Y BLOQUEADO",
            "type": "Tipo",
            "monthly": "Mensual",
            "dateRange": "Rango de Fechas",
            "closingAudit": "Auditoría de Cierre",
            "executedBy": "Ejecutado por",
            "technicalAdmin": "Administrador Técnico",
            "timestamp": "Sello de Tiempo",
            "kpis": "INDICADORES FINANCIEROS CLAVE (KPIs)",
            "totalRevenue": "Ingresos Totales",
            "totalExpenses": "Gastos Totales",
            "netIncome": "Utilidad Neta",
            "transVolume": "Volumen Trans.",
            "entries": "Asientos Contables",
            "doubleEntryVerification": "VERIFICACIÓN PARTIDA DOBLE",
            "totalDebits": "Total Débitos",
            "totalCredits": "Total Créditos",
            "difference": "Diferencia",
            "auditTrail": "AUDIT TRAIL DE CIERRE",
            "controls": "CONTROLES",
            "ok": "OK",
            "wrn": "WRN",
            "passedStatus": "Passed",
            "additionalNotes": "Observaciones Adicionales",
            "reportId": "Reporte ID",
            "closeDashboard": "Cerrar Dashboard",
            "downloadPdf": "DESCARGAR PDF"
        },
        "steps": {
            "transactionValidation": "Validación de Transacciones",
            "bankReconciliation": "Conciliación Bancaria",
            "accountingAdjustments": "Ajustes Contables",
            "trialBalance": "Balance de Comprobación",
            "confirmation": "Confirmación",
            "step": "Paso"
        }
    },
    "incomeStatement": {
        "pdfHeader": "ESTADO DE RESULTADOS (P&L)",
        "pdfCode": "COD",
        "pdfAccount": "CUENTA",
        "pdfAmount": "MONTO (USD)",
        "pdfTotal": "TOTAL"
    },
    "accountingDiagnosis": {
        "sqlRawTrace": "Rastro SQL Crudo",
        "unknownError": "Error desconocido",
        "userInitiated": "Usuario inició diagnóstico del sistema contable",
        "diagnosisError": "Error en componente de diagnóstico"
    },
    "journalEntry": {
        "newFolio": "Nuevo Folio Diario",
        "manualEntrySubtitle": "Entrada de Datos Manual • US GAAP v2025",
        "balanced": "BALANCEADO",
        "unbalanced": "DESCUADRE",
        "postEntry": "Contabilizar Asiento",
        "descriptionLabel": "Glosa / Descripción General",
        "descriptionPlaceholder": "Ej: Ajuste de amortización mensual - Activos Fijos...",
        "dateLabel": "Fecha de Registro",
        "accountCodeHeader": "Cuenta / Código",
        "lineDetailHeader": "Detalle de Línea",
        "debitsHeader": "Cargos (DR)",
        "creditsHeader": "Abonos (CR)",
        "accountPlaceholder": "Cuenta...",
        "descPlaceholder": "Descripción opcional...",
        "deleteLineTitle": "Eliminar Línea",
        "addLine": "Agregar Nueva Línea",
        "auditGuideline": "Pauta de Auditoría",
        "auditText": "Toda entrada manual queda registrada con marca de tiempo inmutable y hash de integridad. El descuadre de céntimos no está permitido bajo protocolos US GAAP configurados en el sistema."
    }
};

const enKeys = {
    "closure": {
        "checklist": {
            "title": "Validation Checklist",
            "passed": "PASSED",
            "warnings": "WARNINGS",
            "errors": "ERRORS",
            "pending": "PENDING",
            "validating": "Validating...",
            "runValidations": "Run Validations",
            "technicalAudit": "Technical Audit",
            "stepStatus": "Final Step Status",
            "completedValidations": "validations completed",
            "errorActionRequired": "ERROR: ACTION REQUIRED",
            "warningsDetected": "WARNINGS DETECTED",
            "readyToContinue": "READY TO CONTINUE",
            "auditRecorded": "Results recorded in immutable audit"
        },
        "report": {
            "title": "Closing Report",
            "periodDetails": "Period Details",
            "status": "Status",
            "closedLocked": "CLOSED & LOCKED",
            "type": "Type",
            "monthly": "Monthly",
            "dateRange": "Date Range",
            "closingAudit": "Closing Audit",
            "executedBy": "Executed by",
            "technicalAdmin": "Technical Admin",
            "timestamp": "Timestamp",
            "kpis": "KEY FINANCIAL INDICATORS (KPIs)",
            "totalRevenue": "Total Revenue",
            "totalExpenses": "Total Expenses",
            "netIncome": "Net Income",
            "transVolume": "Trans. Volume",
            "entries": "Journal Entries",
            "doubleEntryVerification": "DOUBLE ENTRY VERIFICATION",
            "totalDebits": "Total Debits",
            "totalCredits": "Total Credits",
            "difference": "Difference",
            "auditTrail": "CLOSING AUDIT TRAIL",
            "controls": "CONTROLS",
            "ok": "OK",
            "wrn": "WRN",
            "passedStatus": "Passed",
            "additionalNotes": "Additional Observations",
            "reportId": "Report ID",
            "closeDashboard": "Close Dashboard",
            "downloadPdf": "DOWNLOAD PDF"
        },
        "steps": {
            "transactionValidation": "Transaction Validation",
            "bankReconciliation": "Bank Reconciliation",
            "accountingAdjustments": "Accounting Adjustments",
            "trialBalance": "Trial Balance",
            "confirmation": "Confirmation",
            "step": "Step"
        }
    },
    "incomeStatement": {
        "pdfHeader": "INCOME STATEMENT (P&L)",
        "pdfCode": "COD",
        "pdfAccount": "ACCOUNT",
        "pdfAmount": "AMOUNT (USD)",
        "pdfTotal": "TOTAL"
    },
    "accountingDiagnosis": {
        "sqlRawTrace": "Raw SQL Trace",
        "unknownError": "Unknown error",
        "userInitiated": "User initiated accounting system diagnosis",
        "diagnosisError": "Error in diagnosis component"
    },
    "journalEntry": {
        "newFolio": "New Journal Folio",
        "manualEntrySubtitle": "Manual Data Entry • US GAAP v2025",
        "balanced": "BALANCED",
        "unbalanced": "IMBALANCE",
        "postEntry": "Post Entry",
        "descriptionLabel": "Gloss / General Description",
        "descriptionPlaceholder": "Ex: Monthly depreciation adjustment - Fixed Assets...",
        "dateLabel": "Registration Date",
        "accountCodeHeader": "Account / Code",
        "lineDetailHeader": "Line Detail",
        "debitsHeader": "Debits (DR)",
        "creditsHeader": "Credits (CR)",
        "accountPlaceholder": "Account...",
        "descPlaceholder": "Optional description...",
        "deleteLineTitle": "Delete Line",
        "addLine": "Add New Line",
        "auditGuideline": "Audit Guideline",
        "auditText": "All manual entries are recorded with immutable timestamp and integrity hash. Cent imbalance is not permitted under US GAAP protocols configured in the system."
    }
};

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

deepMerge(es, newKeys);
deepMerge(en, enKeys);

fs.writeFileSync(esPath, JSON.stringify(es, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Batch 1 accounting i18n keys added successfully.');
