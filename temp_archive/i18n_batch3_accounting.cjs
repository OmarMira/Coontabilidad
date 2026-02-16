const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, 'src/assets/locales/es.json');
const enPath = path.join(__dirname, 'src/assets/locales/en.json');

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeys = {
    "periodClosure": {
        "wizardTitle": "Asistente de Cierre",
        "processing": "Procesando...",
        "auditActivated": "Auditoría Industrial Activada",
        "systemError": "Error del Sistema",
        "errorUnknown": "Error desconocido",
        "back": "Vuelve",
        "milestone": "Hito",
        "continue": "Continuar",
        "closing": "CERRANDO...",
        "executeClosing": "EJECUTAR CIERRE",
        "steps": {
            "transactions": "Validación de Transacciones",
            "transactionsDesc": "Verificar que todas las transacciones estén registradas",
            "bankReconciliation": "Conciliación Bancaria",
            "bankReconciliationDesc": "Verificar que la conciliación bancaria esté completa",
            "payroll": "Validación de Nómina",
            "payrollDesc": "Verificar que las nóminas estén procesadas y aprobadas",
            "adjustments": "Ajustes Contables",
            "adjustmentsDesc": "Verificar depreciaciones y asientos de ajuste",
            "trialBalance": "Balance de Comprobación",
            "trialBalanceDesc": "Generar y verificar el balance de comprobación",
            "confirmation": "Confirmación y Cierre",
            "confirmationDesc": "Revisar resumen y confirmar el cierre del período"
        },
        "periodNotFound": "No se encontró el período contable",
        "closeError": "Error al cerrar el período",
        "wizardCloseNote": "Cierre realizado mediante wizard"
    },
    "transactionValidation": {
        "phaseTitle": "Fase de Integridad",
        "phaseDesc": "Verificaremos que todas las transacciones operativas estén debidamente sincronizadas y el libro mayor esté cuadrado antes del cierre.",
        "guidelinesTitle": "Directrices Técnicas",
        "checks": {
            "invoicesRegistered": "Todas las facturas del período están registradas",
            "billsRegistered": "Todos los gastos del período están registrados",
            "noPending": "No hay transacciones pendientes de aprobar",
            "entriesBalanced": "Todos los asientos contables están balanceados"
        },
        "tips": [
            "Revisa que todas las facturas emitidas coincidan con el libro de ventas.",
            "Verifica que las facturas de proveedores (Bills) estén pagadas o provisionadas.",
            "Cero transacciones en estado 'Draft' permitidas para cierre.",
            "Coteja los números de folio para evitar saltos en la secuencia."
        ]
    },
    "bankReconciliation": {
        "phaseTitle": "Validación de Tesorería",
        "phaseDesc": "Aseguramos que el efectivo en bancos coincida exactamente con los registros contables. Un descuadre aquí invalida los estados financieros.",
        "protocolTitle": "Protocolo de Conciliación",
        "checks": {
            "reconciliationComplete": "Conciliación bancaria completada para el período",
            "noUnmatched": "No hay transacciones bancarias sin conciliar",
            "balanceMatches": "Saldo bancario coincide con saldo contable",
            "openPanel": "Abrir Panel Bancario"
        },
        "tips": [
            "Importa el extracto bancario oficial en formato CSV o OFX.",
            "Registra comisiones e intereses bancarios antes de validar.",
            "Verifica que no existan depósitos o cheques en tránsito obsoletos.",
            "El saldo de cierre debe ser igual al saldo del banco al día final."
        ]
    },
    "payrollValidation": {
        "phaseTitle": "Validación Laboral",
        "phaseDesc": "Verificamos que todos los pasivos laborales estén registrados y los impuestos de nómina cuadrados con el Departamento de Rentas (IRS/DOR).",
        "guidelinesTitle": "Directrices de Nómina",
        "checks": {
            "processed": "Nóminas del período procesadas",
            "noPending": "No hay nóminas pendientes de aprobar",
            "entriesGenerated": "Asientos contables de nómina generados",
            "taxesCalculated": "Impuestos de nómina calculados correctamente",
            "approvalStatus": "Estado de aprobación de nómina",
            "reviewPayrolls": "Revisar Nóminas",
            "ledgerSync": "Sincronización con Libro Mayor",
            "taxValidation": "Cálculo impositivo validado"
        },
        "stats": {
            "executions": "Ejecuciones",
            "grossPay": "Masa Salarial Bruta",
            "taxLoad": "Carga Impositiva",
            "net": "Neto",
            "withholdings": "Retenciones Federales + FICA"
        },
        "criticalAction": "Acción Crítica Requerida",
        "pendingPayrollsWarning": "Existen nóminas sin aprobar. El cierre contable no puede consolidar pasivos laborales pendientes.",
        "tips": [
            "Todas las nóminas deben estar en estado 'Paid' o 'Approved'.",
            "Al menos un asiento de diario debe estar vinculado a cada nómina.",
            "Los impuestos deben haber sido liquidados o provisionados.",
            "Si no hubo operaciones en el mes, marca este paso como validado."
        ],
        "messages": {
            "detected": "{count} nóminas detectadas",
            "noneInRange": "Sin nóminas en el rango",
            "flowComplete": "Flujo de aprobación completo",
            "pendingCount": "{count} por aprobar",
            "entriesLinked": "Asientos vinculados correctamente",
            "entriesMissing": "Faltan asientos contables",
            "taxAmount": "${amount} en impuestos FL/Federal",
            "noTaxes": "Sin cálculos impositivos",
            "ok": "OK",
            "pnd": "PND"
        }
    },
    "adjustments": {
        "phaseTitle": "Fase de Ajustes",
        "phaseDesc": "Registramos las correcciones de cierre, amortizaciones y gastos diferidos para asegurar que el balance refleje la realidad económica del negocio.",
        "bestPractices": "Best Practices de Ajuste",
        "checks": {
            "depreciation": "Depreciaciones del período calculadas",
            "calcDepreciation": "Calcular Depreciaciones",
            "entriesRecorded": "Asientos de ajuste registrados",
            "createEntry": "Crear Asiento",
            "accruals": "Acumulaciones y diferimientos registrados",
            "inventory": "Inventario físico vs sistema reconciliado",
            "goToInventory": "Ir a Inventario"
        },
        "tips": [
            "Calcula la depreciación de activos fijos antes de generar el balance.",
            "Asegúrate de que los gastos por servicios públicos estén acumulados.",
            "Verifica el conteo físico de inventario si manejas productos.",
            "Revisa saldos de clientes y aplica castigos si son incobrables."
        ]
    },
    "trialBalanceStep": {
        "phaseTitle": "Consolidación Final",
        "phaseDesc": "Generamos el balance de comprobación para certificar que la sumatoria de débitos y créditos es idéntica antes de emitir estados financieros.",
        "controlPoints": "Puntos de Control",
        "checks": {
            "generated": "Balance de comprobación generado",
            "balanced": "Total débitos = Total créditos",
            "noUnbalanced": "No hay cuentas desbalanceadas",
            "classified": "Todas las cuentas están correctamente clasificadas"
        },
        "preview": "Previsualización de Balance",
        "download": "Descargar",
        "mainAccount": "Cuenta Principal",
        "netPosition": "Posición Neta",
        "successMsg": "Balance consolidado exitosamente. Ver detalles en el checklist superior para desglose por cuenta.",
        "validating": "Ejecutando algoritmos de validación...",
        "periodTotals": "TOTALES DEL PERÍODO",
        "tips": [
            "La diferencia entre total débitos y créditos debe ser exactamente 0.00.",
            "Analiza cuentas con saldos negativos inesperados (ej. bancos en rojo).",
            "Confirma que las cuentas de resultados (Ingresos/Gastos) estén cuadradas.",
            "Genera e imprime una copia física para el archivo auditor del período."
        ]
    },
    "confirmationStep": {
        "phaseTitle": "Fase Final",
        "phaseDesc": "Estás a punto de bloquear irreversiblemente el período contable. Asegúrate de que todos los datos sean precisos antes de confirmar.",
        "metaInfo": "Meta-información del Cierre",
        "periodName": "Nombre del Período",
        "execution": "Ejecución",
        "start": "Inicio",
        "end": "Fin",
        "auditPerformance": "Performance de Auditoría",
        "securityLock": "Bloqueo de Seguridad",
        "lockMsg": "Imposible cerrar período con {count} errores críticos. Corrige los pasos previos.",
        "notesLabel": "Notas y Observaciones de Auditoría",
        "notesPlaceholder": "Ej: Conciliación aprobada con ajustes menores en amortización...",
        "certify": "CERTIFICO LA VERACIDAD DE LOS DATOS",
        "certifyDesc": "Entiendo que al ejecutar el cierre, el sistema bloqueará registros retroactivos inmutabilizando el período legalmente.",
        "confirmFinal": "CONFIRMAR CIERRE FINAL",
        "consolidating": "CONSOLIDANDO..."
    }
};

const enKeys = {
    "periodClosure": {
        "wizardTitle": "Closing Wizard",
        "processing": "Processing...",
        "auditActivated": "Industrial Audit Activated",
        "systemError": "System Error",
        "errorUnknown": "Unknown Error",
        "back": "Back",
        "milestone": "Milestone",
        "continue": "Continue",
        "closing": "CLOSING...",
        "executeClosing": "EXECUTE CLOSING",
        "steps": {
            "transactions": "Transaction Validation",
            "transactionsDesc": "Verify all transactions are recorded",
            "bankReconciliation": "Bank Reconciliation",
            "bankReconciliationDesc": "Verify bank reconciliation is complete",
            "payroll": "Payroll Validation",
            "payrollDesc": "Verify payrolls are processed and approved",
            "adjustments": "Accounting Adjustments",
            "adjustmentsDesc": "Verify depreciations and adjustment entries",
            "trialBalance": "Trial Balance",
            "trialBalanceDesc": "Generate and verify trial balance",
            "confirmation": "Confirmation and Closing",
            "confirmationDesc": "Review summary and confirm period closing"
        },
        "periodNotFound": "Accounting period not found",
        "closeError": "Error closing period",
        "wizardCloseNote": "Closed via wizard"
    },
    "transactionValidation": {
        "phaseTitle": "Integrity Phase",
        "phaseDesc": "We will verify that all operational transactions are properly synchronized and the general ledger is balanced before closing.",
        "guidelinesTitle": "Technical Guidelines",
        "checks": {
            "invoicesRegistered": "All invoices for the period are registered",
            "billsRegistered": "All expenses for the period are registered",
            "noPending": "No pending transactions to approve",
            "entriesBalanced": "All journal entries are balanced"
        },
        "tips": [
            "Check that all issued invoices match the sales book.",
            "Verify that vendor bills are paid or accrued.",
            "Zero transactions in 'Draft' state allowed for closing.",
            "Cross-check folio numbers to avoid sequence gaps."
        ]
    },
    "bankReconciliation": {
        "phaseTitle": "Treasury Validation",
        "phaseDesc": "We ensure cash in banks matches exactly with accounting records. A discrepancy here invalidates financial statements.",
        "protocolTitle": "Reconciliation Protocol",
        "checks": {
            "reconciliationComplete": "Bank reconciliation completed for the period",
            "noUnmatched": "No unmatched bank transactions",
            "balanceMatches": "Bank balance matches accounting balance",
            "openPanel": "Open Banking Panel"
        },
        "tips": [
            "Import official bank statement in CSV or OFX format.",
            "Record bank fees and interest before validating.",
            "Verify there are no obsolete deposits or checks in transit.",
            "Closing balance must equal bank balance on final day."
        ]
    },
    "payrollValidation": {
        "phaseTitle": "Labor Validation",
        "phaseDesc": "We verify all labor liabilities are recorded and payroll taxes balanced with Revenue Department (IRS/DOR).",
        "guidelinesTitle": "Payroll Guidelines",
        "checks": {
            "processed": "Period payrolls processed",
            "noPending": "No pending payrolls to approve",
            "entriesGenerated": "Payroll journal entries generated",
            "taxesCalculated": "Payroll taxes calculated correctly",
            "approvalStatus": "Payroll approval status",
            "reviewPayrolls": "Review Payrolls",
            "ledgerSync": "General Ledger Synchronization",
            "taxValidation": "Tax calculation validated"
        },
        "stats": {
            "executions": "Executions",
            "grossPay": "Gross Payroll",
            "taxLoad": "Tax Load",
            "net": "Net",
            "withholdings": "Federal Withholdings + FICA"
        },
        "criticalAction": "Critical Action Required",
        "pendingPayrollsWarning": "There are unapproved payrolls. Accounting closing cannot consolidate pending labor liabilities.",
        "tips": [
            "All payrolls must be in 'Paid' or 'Approved' status.",
            "At least one journal entry must be linked to each payroll.",
            "Taxes must have been settled or accrued.",
            "If no operations in month, mark this step as validated."
        ],
        "messages": {
            "detected": "{count} payrolls detected",
            "noneInRange": "No payrolls in range",
            "flowComplete": "Approval flow complete",
            "pendingCount": "{count} pending approval",
            "entriesLinked": "Entries linked correctly",
            "entriesMissing": "Missing journal entries",
            "taxAmount": "${amount} in FL/Federal taxes",
            "noTaxes": "No tax calculations",
            "ok": "OK",
            "pnd": "PND"
        }
    },
    "adjustments": {
        "phaseTitle": "Adjustments Phase",
        "phaseDesc": "We record closing corrections, amortizations, and deferred expenses to ensure the balance reflects the business economic reality.",
        "bestPractices": "Adjustment Best Practices",
        "checks": {
            "depreciation": "Period depreciations calculated",
            "calcDepreciation": "Calculate Depreciations",
            "entriesRecorded": "Adjustment entries recorded",
            "createEntry": "Create Entry",
            "accruals": "Accruals and deferrals recorded",
            "inventory": "Physical inventory vs system reconciled",
            "goToInventory": "Go to Inventory"
        },
        "tips": [
            "Calculate fixed asset depreciation before generating balance.",
            "Ensure utility expenses are accrued.",
            "Verify physical inventory count if managing products.",
            "Review customer balances and write off if uncollectible."
        ]
    },
    "trialBalanceStep": {
        "phaseTitle": "Final Consolidation",
        "phaseDesc": "We generate the trial balance to certify that sum of debits and credits is identical before issuing financial statements.",
        "controlPoints": "Control Points",
        "checks": {
            "generated": "Trial balance generated",
            "balanced": "Total debits = Total credits",
            "noUnbalanced": "No unbalanced accounts",
            "classified": "All accounts are correctly classified"
        },
        "preview": "Balance Preview",
        "download": "Download",
        "mainAccount": "Main Account",
        "netPosition": "Net Position",
        "successMsg": "Balance consolidated successfully. See details in checklist above for account breakdown.",
        "validating": "Running validation algorithms...",
        "periodTotals": "PERIOD TOTALS",
        "tips": [
            "Difference between total debits and credits must be exactly 0.00.",
            "Analyze accounts with unexpected negative balances (e.g. overdrafts).",
            "Confirm income statement accounts (Revenue/Expenses) are balanced.",
            "Generate and print a physical copy for the period audit file."
        ]
    },
    "confirmationStep": {
        "phaseTitle": "Final Phase",
        "phaseDesc": "You are about to irreversibly lock the accounting period. Ensure all data is accurate before confirming.",
        "metaInfo": "Closing Meta-information",
        "periodName": "Period Name",
        "execution": "Execution",
        "start": "Start",
        "end": "End",
        "auditPerformance": "Audit Performance",
        "securityLock": "Security Lock",
        "lockMsg": "Impossible to close period with {count} critical errors. Fix previous steps.",
        "notesLabel": "Audit Notes and Observations",
        "notesPlaceholder": "Ex: Reconciliation approved with minor adjustments in amortization...",
        "certify": "I CERTIFY DATA ACCURACY",
        "certifyDesc": "I understand that by executing the closing, the system will lock retroactive records, ensuring legal immutability of the period.",
        "confirmFinal": "CONFIRM FINAL CLOSING",
        "consolidating": "CONSOLIDATING..."
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

console.log('Batch 3 accounting i18n keys added successfully.');
