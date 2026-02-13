const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'src/assets/locales/es.json');
const enPath = path.join(__dirname, 'src/assets/locales/en.json');

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeys = {
    "ledgerHub": {
        "title": "Ledger Hub",
        "subtitle": "Núcleo de Operaciones Contables • US GAAP",
        "errorTitle": "Protocolo de Seguridad Activado",
        "errorDesc": "El núcleo contable ha detectado una inconsistencia crítica en la estructura de datos. Por favor reinicie los protocolos.",
        "restartProtocols": "Reiniciar Protocolos de Enlace",
        "controlCenter": "Centro de Control",
        "journalEntries": "Libro Diario",
        "ledgerValidation": "Libro Mayor",
        "auxiliaries": "Auxiliares",
        "dailyBook": "LIBRO DIARIO",
        "dailyBookDesc": "Registro cronológico inmutable de todas las operaciones.",
        "realTimeSync": "SINCRONIZACIÓN EN TIEMPO REAL",
        "generalLedger": "LIBRO MAYOR",
        "generalLedgerDesc": "Balance acumulado y saldos por cuenta.",
        "lastClosure": "Último Cierre: {date}",
        "auxiliariesTitle": "AUXILIARES",
        "auxiliariesDesc": "Desglose analítico por cliente, proveedor y cuenta.",
        "validatedUsGaap": "VALIDADO US GAAP"
    },
    "periodClosing": {
        "wizardTitle": "Wizard de Cierre",
        "accountingClosing": "Cierre Contable",
        "steps": {
            "check": "Saldos",
            "audit": "Auditoría",
            "adjust": "Ajustes",
            "confirm": "Cierre"
        },
        "financialHealthReview": "Revisión de Salud Financiera",
        "periodTrialBalance": "Balance de Comprobación del Periodo",
        "balanced": "Saldos Cuadrados",
        "imbalance": "Desbalance Detectado",
        "codeAccount": "Código / Cuenta",
        "periodDebits": "Débitos Periodo",
        "periodCredits": "Créditos Periodo",
        "noMovements": "No se encontraron movimientos",
        "moreAccounts": "Y {count} cuentas adicionales cargadas...",
        "controlTotals": "Totales de Control",
        "continueAudit": "Continuar Auditoría",
        "opIntegrityValidation": "Validación de Integridad Operativa",
        "integrityDesc": "El sistema está cruzando datos transaccionales para asegurar que no existan cabos sueltos antes del bloqueo fiscal.",
        "validations": {
            "ledgerBalanced": "Balance de Partida Doble",
            "inventoryChecks": "Consistencia de Inventario",
            "taxReconciled": "Conciliación Fiscal (Florida DR-15)",
            "auditIntact": "Integridad de Cadena Audit (Iron Core)"
        },
        "back": "Atrás",
        "nextAdjustments": "Siguiente: Ajustes",
        "autoClosingEntries": "Asientos de Cierre Automáticos",
        "autoClosingDesc": "¿Desea que el sistema genere automáticamente el asiento de cierre de resultados para transferir los saldos de ingresos y gastos a Utilidades Retenidas?",
        "generateEntry": "Generar Asiento",
        "skipStep": "Omitir Paso",
        "continueToClosing": "Continuar al Cierre",
        "criticalWarning": "Advertencia Crítica",
        "warningDesc": "Al completar el cierre, el periodo de {period} quedará **BLOQUEADO**. No se podrán registrar gastos, facturas ni asientos adicionales.",
        "autoEntryGenerated": "Se generará asiento automático de resultados",
        "processing": "PROCESANDO BLOQUEO CONTABLE...",
        "confirm": "CONFIRMAR CIERRE DEFINITIVO",
        "cancel": "O cancelar y revisar más tarde",
        "poweredBy": "Powered by Iron Core Integrity Engine",
        "closingEntrySuccess": "Asiento de cierre de resultados generado exitosamente.",
        "periodLockedSuccess": "Periodo {period} bloqueado correctamente.",
        "criticalError": "Error crítico al cerrar periodo: "
    },
    "trialBalance": {
        "title": "Balance Comprobación",
        "subtitle": "Audit Ready Protocol • GAAP Compliance",
        "periodLabel": "Período Fiscal",
        "diagnosis": "Diagnóstico",
        "exportExcel": "Export Excel",
        "reportPDF": "Reporte PDF",
        "codeHeader": "Código Estructural",
        "descHeader": "Descripción de Cuenta",
        "natHeader": "NAT",
        "prevBalance": "Saldo Anterior",
        "debits": "Débitos (DR)",
        "credits": "Créditos (CR)",
        "closingBalance": "Saldo de Cierre",
        "protocol": "Protocolo",
        "syncing": "Sincronizando Libro Auxiliar...",
        "noMovements": "Sin Movimientos Registrados",
        "repairStructure": "Reparar Estructura",
        "injectDemo": "Inyectar Demo",
        "auditConsolidation": "Consolidación de Auditoría Interna",
        "debitConsumption": "Consumo Débito",
        "creditConsumption": "Consumo Crédito",
        "integrityBook": "Libro Íntegro",
        "criticalImbalance": "Desbalance Crítico",
        "diff": "Diferencia",
        "auxHistory": "Historial Auxiliar",
        "registeredTrans": "Transacciones Registradas en el Período",
        "effectiveDate": "Fecha Efectiva",
        "reference": "Referencia / Folio",
        "concept": "Concepto Operativo",
        "debitAction": "Debitar (DR)",
        "creditAction": "Acreditar (CR)",
        "zeroMovements": "Cero movimientos en este nodo auxiliar",
        "totalRecords": "Registros Totales",
        "entries": "Asientos",
        "closingDebit": "Cierre Débito",
        "closingCredit": "Cierre Crédito",
        "netDiagnosis": "Diagnóstico de Red",
        "verification": "Verificación de Registros Contables",
        "perfectSync": "Sincronización Perfecta",
        "syncDesc": "No se hallaron discrepancias de céntimos ni errores de foliación en el libro mayor. La base de datos es consistente para cierre de período.",
        "inconsistencyLog": "Bitácora de Inconsistencias",
        "finishScan": "Finalizar Escaneo",
        "openingBalance": "Saldo Apertura",
        "debitFlow": "Flujo Débitos",
        "creditFlow": "Flujo Créditos",
        "integrity": "Integridad",
        "calibrated": "CALIBRADO",
        "error": "ERROR",
        "repairConfirmation": "¿Inyectar registros de prueba históricos? Operación registrable en logs."
    }
};

const enKeys = {
    "ledgerHub": {
        "title": "Ledger Hub",
        "subtitle": "Accounting Operations Core • US GAAP",
        "errorTitle": "Security Protocol Activated",
        "errorDesc": "The accounting core has detected a critical inconsistency in the data structure. Please restart the link protocols.",
        "restartProtocols": "Restart Link Protocols",
        "controlCenter": "Control Center",
        "journalEntries": "Journal Entries",
        "ledgerValidation": "General Ledger",
        "auxiliaries": "Auxiliaries",
        "dailyBook": "JOURNAL BOOK",
        "dailyBookDesc": "Immutable chronological record of all operations.",
        "realTimeSync": "REAL-TIME SYNC",
        "generalLedger": "GENERAL LEDGER",
        "generalLedgerDesc": "Accumulated balance and balances by account.",
        "lastClosure": "Last Closure: {date}",
        "auxiliariesTitle": "AUXILIARIES",
        "auxiliariesDesc": "Analytical breakdown by client, vendor, and account.",
        "validatedUsGaap": "US GAAP VALIDATED"
    },
    "periodClosing": {
        "wizardTitle": "Closing Wizard",
        "accountingClosing": "Accounting Closing",
        "steps": {
            "check": "Balances",
            "audit": "Audit",
            "adjust": "Adjustments",
            "confirm": "Close"
        },
        "financialHealthReview": "Financial Health Review",
        "periodTrialBalance": "Period Trial Balance",
        "balanced": "Balanced",
        "imbalance": "Imbalance Detected",
        "codeAccount": "Code / Account",
        "periodDebits": "Period Debits",
        "periodCredits": "Period Credits",
        "noMovements": "No movements found",
        "moreAccounts": "And {count} additional accounts loaded...",
        "controlTotals": "Control Totals",
        "continueAudit": "Continue Audit",
        "opIntegrityValidation": "Operational Integrity Validation",
        "integrityDesc": "The system is cross-referencing transactional data to ensure no loose ends exist before fiscal lock.",
        "validations": {
            "ledgerBalanced": "Double Entry Balance",
            "inventoryChecks": "Inventory Consistency",
            "taxReconciled": "Tax Reconciliation (Florida DR-15)",
            "auditIntact": "Audit Chain Integrity (Iron Core)"
        },
        "back": "Back",
        "nextAdjustments": "Next: Adjustments",
        "autoClosingEntries": "Automatic Closing Entries",
        "autoClosingDesc": "Do you want the system to automatically generate the closing entry for results to transfer revenue and expense balances to Retained Earnings?",
        "generateEntry": "Generate Entry",
        "skipStep": "Skip Step",
        "continueToClosing": "Continue to Closing",
        "criticalWarning": "Critical Warning",
        "warningDesc": "Upon completing the closing, the period of {period} will be **LOCKED**. No additional expenses, invoices, or entries can be recorded.",
        "autoEntryGenerated": "Automatic closing entry will be generated",
        "processing": "PROCESSING ACCOUNTING LOCK...",
        "confirm": "CONFIRM DEFINITIVE CLOSING",
        "cancel": "Or cancel and review later",
        "poweredBy": "Powered by Iron Core Integrity Engine",
        "closingEntrySuccess": "Results closing entry generated successfully.",
        "periodLockedSuccess": "Period {period} locked successfully.",
        "criticalError": "Critical error closing period: "
    },
    "trialBalance": {
        "title": "Trial Balance",
        "subtitle": "Audit Ready Protocol • GAAP Compliance",
        "periodLabel": "Fiscal Period",
        "diagnosis": "Diagnosis",
        "exportExcel": "Export Excel",
        "reportPDF": "Report PDF",
        "codeHeader": "Structural Code",
        "descHeader": "Account Description",
        "natHeader": "NAT",
        "prevBalance": "Previous Balance",
        "debits": "Debits (DR)",
        "credits": "Credits (CR)",
        "closingBalance": "Closing Balance",
        "protocol": "Protocol",
        "syncing": "Syncing Auxiliary Ledger...",
        "noMovements": "No Registered Movements",
        "repairStructure": "Repair Structure",
        "injectDemo": "Inject Demo",
        "auditConsolidation": "Internal Audit Consolidation",
        "debitConsumption": "Debit Consumption",
        "creditConsumption": "Credit Consumption",
        "integrityBook": "Integrity Book",
        "criticalImbalance": "Critical Imbalance",
        "diff": "Difference",
        "auxHistory": "Auxiliary History",
        "registeredTrans": "Transactions Registered in Period",
        "effectiveDate": "Effective Date",
        "reference": "Reference / Folio",
        "concept": "Operational Concept",
        "debitAction": "Debit (DR)",
        "creditAction": "Credit (CR)",
        "zeroMovements": "Zero movements in this auxiliary node",
        "totalRecords": "Total Records",
        "entries": "Entries",
        "closingDebit": "Closing Debit",
        "closingCredit": "Closing Credit",
        "netDiagnosis": "Network Diagnosis",
        "verification": "Accounting Records Verification",
        "perfectSync": "Perfect Synchronization",
        "syncDesc": "No cent discrepancies or foliation errors found in the general ledger. Database is consistent for period closing.",
        "inconsistencyLog": "Inconsistency Log",
        "finishScan": "Finish Scan",
        "openingBalance": "Opening Balance",
        "debitFlow": "Debit Flow",
        "creditFlow": "Credit Flow",
        "integrity": "Integrity",
        "calibrated": "CALIBRATED",
        "error": "ERROR",
        "repairConfirmation": "Inject historical test records? Operation registrable in logs."
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

console.log('Batch 2 accounting i18n keys added successfully.');
