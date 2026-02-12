
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    // ---------------------------------------------------------
    // REPORTS DASHBOARD (IMAGE 1)
    // ---------------------------------------------------------
    "reportsDashboard.compliance.title": "CUMPLIMIENTO NORMATIVO",
    "reportsDashboard.compliance.loading": "CARGANDO CUMPLIMIENTO...",
    "reportsDashboard.compliance.statusPending": "PENDIENTE",
    "reportsDashboard.compliance.statusGenerated": "GENERADO",
    "reportsDashboard.compliance.verifiedBy": "VERIFICADO POR",
    "reportsDashboard.compliance.noActivity": "SIN ACTIVIDAD",
    "reportsDashboard.compliance.noHistory": "SIN HISTORIAL",
    "reportsDashboard.compliance.outdatedRates": "TASAS DESACTUALIZADAS",
    "reportsDashboard.compliance.criticalNotice": "AVISO CRÍTICO",
    "reportsDashboard.compliance.closeView": "CERRAR VISTA",

    // ---------------------------------------------------------
    // SUPPLIER DASHBOARD (IMAGE 2)
    // ---------------------------------------------------------
    "supplierDashboard.title": "DASHBOARD PROVEEDORES",
    "supplierDashboard.subtitle": "ANÁLISIS DE CUENTAS POR PAGAR",
    "supplierDashboard.totalPartners": "PROVEEDORES",
    "supplierDashboard.capitalOutflow": "FLUJO DE CAPITAL",
    "supplierDashboard.accountsPayable": "CUENTAS POR PAGAR",
    "supplierDashboard.criticalAP": "AP CRÍTICO",
    "supplierDashboard.newThisMonth": "{count} NUEVOS ESTE MES",
    "supplierDashboard.avgTicket": "TICKET PROM.",
    "supplierDashboard.ofExpense": "DEL GASTO",
    "supplierDashboard.overdue": "VENCIDO",
    "supplierDashboard.costConcentration": "CONCENTRACIÓN DE COSTOS",
    "supplierDashboard.top10Volume": "TOP 10 POR VOLUMEN",
    "supplierDashboard.debtAging": "ANTIGÜEDAD DE DEUDA",
    "supplierDashboard.pendingDistribution": "DISTRIBUCIÓN PENDIENTE",
    "supplierDashboard.eliteMapping": "MAPEO ELITE",
    "supplierDashboard.performanceDetail": "DETALLE DE RENDIMIENTO",
    "supplierDashboard.ranking": "RANKING",
    "supplierDashboard.supplierLegalName": "RAZÓN SOCIAL",
    "supplierDashboard.totalExpense": "GASTO TOTAL",
    "supplierDashboard.bills": "FACTURAS",
    "supplierDashboard.impact": "IMPACTO %",
    "supplierDashboard.unknownSupplier": "PROVEEDOR DESCONOCIDO",
    "supplierDashboard.analyzing": "ANALIZANDO PROVEEDORES...",

    // ---------------------------------------------------------
    // FINANCIAL DASHBOARD (IMAGE 3)
    // ---------------------------------------------------------
    "financialDashboard.title": "DASHBOARD FINANCIERO",
    "financialDashboard.subtitle": "ESTADO INTEGRAL DE LA EMPRESA",
    "financialDashboard.periods.6m": "6 MESES",
    "financialDashboard.periods.ytd": "AÑO ACTUAL",
    "financialDashboard.periods.12m": "12 MESES",
    "financialDashboard.revenue": "INGRESOS",
    "financialDashboard.operating": "GASTOS OPERATIVOS",
    "financialDashboard.profit": "GANANCIA NETA",
    "financialDashboard.margin": "MARGEN",
    "financialDashboard.incomeVsExpenses": "INGRESOS VS GASTOS",
    "financialDashboard.monthlyCashFlow": "FLUJO DE CAJA MENSUAL",
    "financialDashboard.profitTrend": "TENDENCIA DE GANANCIAS",
    "financialDashboard.profitMarginPerformance": "RENDIMIENTO DEL MARGEN",
    "financialDashboard.revenueLabel": "INGRESOS",
    "financialDashboard.expensesLabel": "GASTOS",
    "financialDashboard.profitLabel": "UTILIDAD",
    "financialDashboard.monthlyAuditLog": "LOG DE AUDITORÍA MENSUAL",
    "financialDashboard.historicalSync": "SINCRONIZACIÓN HISTÓRICA",
    "financialDashboard.syncing": "SINCRONIZANDO MÉTRICAS...",
    "financialDashboard.export": "EXPORTAR",
    "financialDashboard.months.jan": "ENE",
    "financialDashboard.months.feb": "FEB",
    "financialDashboard.months.mar": "MAR",
    "financialDashboard.months.abr": "ABR",
    "financialDashboard.months.may": "MAY",
    "financialDashboard.months.jun": "JUN",
    "financialDashboard.months.jul": "JUL",
    "financialDashboard.months.ago": "AGO",
    "financialDashboard.months.sep": "SEP",
    "financialDashboard.months.oct": "OCT",
    "financialDashboard.months.nov": "NOV",
    "financialDashboard.months.dic": "DIC"
};

const enUpdates = {
    // ---------------------------------------------------------
    // REPORTS DASHBOARD (IMAGE 1)
    // ---------------------------------------------------------
    "reportsDashboard.compliance.title": "REGULATORY COMPLIANCE",
    "reportsDashboard.compliance.loading": "LOADING COMPLIANCE...",
    "reportsDashboard.compliance.statusPending": "PENDING",
    "reportsDashboard.compliance.statusGenerated": "GENERATED",
    "reportsDashboard.compliance.verifiedBy": "VERIFIED BY",
    "reportsDashboard.compliance.noActivity": "NO ACTIVITY",
    "reportsDashboard.compliance.noHistory": "NO HISTORY",
    "reportsDashboard.compliance.outdatedRates": "OUTDATED RATES",
    "reportsDashboard.compliance.criticalNotice": "CRITICAL NOTICE",
    "reportsDashboard.compliance.closeView": "CLOSE VIEW",

    // ---------------------------------------------------------
    // SUPPLIER DASHBOARD (IMAGE 2)
    // ---------------------------------------------------------
    "supplierDashboard.title": "SUPPLIER DASHBOARD",
    "supplierDashboard.subtitle": "ACCOUNTS PAYABLE ANALYSIS",
    "supplierDashboard.totalPartners": "TOTAL SUPPLIERS",
    "supplierDashboard.capitalOutflow": "CAPITAL OUTFLOW",
    "supplierDashboard.accountsPayable": "ACCOUNTS PAYABLE",
    "supplierDashboard.criticalAP": "CRITICAL AP",
    "supplierDashboard.newThisMonth": "{count} NEW THIS MONTH",
    "supplierDashboard.avgTicket": "AVG TICKET",
    "supplierDashboard.ofExpense": "OF EXPENSE",
    "supplierDashboard.overdue": "OVERDUE",
    "supplierDashboard.costConcentration": "COST CONCENTRATION",
    "supplierDashboard.top10Volume": "TOP 10 BY VOLUME",
    "supplierDashboard.debtAging": "DEBT AGING",
    "supplierDashboard.pendingDistribution": "PENDING DISTRIBUTION",
    "supplierDashboard.eliteMapping": "ELITE MAPPING",
    "supplierDashboard.performanceDetail": "PERFORMANCE DETAIL",
    "supplierDashboard.ranking": "RANKING",
    "supplierDashboard.supplierLegalName": "LEGAL NAME",
    "supplierDashboard.totalExpense": "TOTAL EXPENSE",
    "supplierDashboard.bills": "BILLS",
    "supplierDashboard.impact": "IMPACT %",
    "supplierDashboard.unknownSupplier": "UNKNOWN SUPPLIER",
    "supplierDashboard.analyzing": "ANALYZING SUPPLIERS...",

    // ---------------------------------------------------------
    // FINANCIAL DASHBOARD (IMAGE 3)
    // ---------------------------------------------------------
    "financialDashboard.title": "FINANCIAL DASHBOARD",
    "financialDashboard.subtitle": "COMPREHENSIVE COMPANY STATUS",
    "financialDashboard.periods.6m": "6 MONTHS",
    "financialDashboard.periods.ytd": "YEAR TO DATE",
    "financialDashboard.periods.12m": "12 MONTHS",
    "financialDashboard.revenue": "REVENUE",
    "financialDashboard.operating": "OPERATING EXPENSES",
    "financialDashboard.profit": "NET PROFIT",
    "financialDashboard.margin": "MARGIN",
    "financialDashboard.incomeVsExpenses": "INCOME VS EXPENSES",
    "financialDashboard.monthlyCashFlow": "MONTHLY CASH FLOW",
    "financialDashboard.profitTrend": "PROFIT TREND",
    "financialDashboard.profitMarginPerformance": "PROFIT MARGIN PERFORMANCE",
    "financialDashboard.revenueLabel": "REVENUE",
    "financialDashboard.expensesLabel": "EXPENSES",
    "financialDashboard.profitLabel": "PROFIT",
    "financialDashboard.monthlyAuditLog": "MONTHLY AUDIT LOG",
    "financialDashboard.historicalSync": "HISTORICAL SYNC",
    "financialDashboard.syncing": "SYNCING METRICS...",
    "financialDashboard.export": "EXPORT",
    "financialDashboard.months.jan": "JAN",
    "financialDashboard.months.feb": "FEB",
    "financialDashboard.months.mar": "MAR",
    "financialDashboard.months.abr": "APR",
    "financialDashboard.months.may": "MAY",
    "financialDashboard.months.jun": "JUN",
    "financialDashboard.months.jul": "JUL",
    "financialDashboard.months.ago": "AUG",
    "financialDashboard.months.sep": "SEP",
    "financialDashboard.months.oct": "OCT",
    "financialDashboard.months.nov": "NOV",
    "financialDashboard.months.dic": "DEC"
};

// Aliases for UPPERCASE coverage (as requested "Exacto como aparece en pantalla")
const uppercaseAliasesES = {};
const uppercaseAliasesEN = {};

for (const [key, value] of Object.entries(esUpdates)) {
    uppercaseAliasesES[key.toUpperCase()] = value;
}
for (const [key, value] of Object.entries(enUpdates)) {
    uppercaseAliasesEN[key.toUpperCase()] = value;
}

function update(file, updates, aliases) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        // Remove BOM if exists
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

        let json = JSON.parse(content);

        // Merge updates
        Object.assign(json, updates);
        Object.assign(json, aliases);

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with massive sync.`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates, uppercaseAliasesES);
update(enFile, enUpdates, uppercaseAliasesEN);
