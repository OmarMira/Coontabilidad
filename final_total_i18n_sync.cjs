
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    // ---------------------------------------------------------
    // REPORTS DASHBOARD (GENERAL VIEW)
    // ---------------------------------------------------------
    "reportsDashboard.title": "DASHBOARD DE REPORTES",
    "reportsDashboard.subtitle": "ACCESO A ESTADOS FINANCIEROS Y ANÁLISIS AL DETALLE",
    "reportsDashboard.new": "NUEVO",
    "reportsDashboard.generate": "GENERAR REPORTES",
    "reportsDashboard.complianceTitle": "CENTRO DE CUMPLIMIENTO",
    "reportsDashboard.complianceDesc": "ESTADO DE DECLARACIONES Y AUDITORÍA DE SEGURIDAD",
    "reportsDashboard.footerVersion": "SISTEMA PROTEGIDO POR IRON CORE v3.0",

    "reportsDashboard.financialCategory.title": "ESTADOS FINANCIEROS",
    "reportsDashboard.financialCategory.description": "REPORTES BASE PARA LA TOMA DE DECISIONES",
    "reportsDashboard.financialCategory.balanceSheet.title": "BALANCE GENERAL",
    "reportsDashboard.financialCategory.balanceSheet.desc": "ESTADO DE SITUACIÓN FINANCIERA COMPLETO",
    "reportsDashboard.financialCategory.incomeStatement.title": "ESTADO DE RESULTADOS",
    "reportsDashboard.financialCategory.incomeStatement.desc": "REVISIÓN DE PÉRDIDAS Y GANANCIAS",
    "reportsDashboard.financialCategory.cashFlow.title": "FLUJO DE CAJA",
    "reportsDashboard.financialCategory.cashFlow.desc": "ANÁLISIS DE MOVIMIENTO DE EFECTIVO",

    "reportsDashboard.ledgerCategory.title": "LIBROS PRINCIPALES",
    "reportsDashboard.ledgerCategory.description": "DETALLE DE AUDITORÍA Y REGISTROS CONTABLES",
    "reportsDashboard.ledgerCategory.generalLedger.title": "LIBRO MAYOR GENERAL",
    "reportsDashboard.ledgerCategory.generalLedger.desc": "MOVIMIENTOS ACUMULADOS POR PERÍODO",
    "reportsDashboard.ledgerCategory.trialBalance.title": "BALANCE DE COMPROBACIÓN",
    "reportsDashboard.ledgerCategory.trialBalance.desc": "VERIFICACIÓN DE SALDOS Y PARTIDAS",
    "reportsDashboard.ledgerCategory.accountLedger.title": "AUXILIAR DE CUENTA",
    "reportsDashboard.ledgerCategory.accountLedger.desc": "DETALLE DE MOVIMIENTOS POR CUENTA",

    "reportsDashboard.analysisCategory.title": "ANÁLISIS Y RATIOS",
    "reportsDashboard.analysisCategory.description": "MÉTRICAS AVANZADAS DE RENDIMIENTO EMPRESARIAL",
    "reportsDashboard.analysisCategory.agingReport.title": "ANTIGÜEDAD DE DEUDA",
    "reportsDashboard.analysisCategory.agingReport.desc": "REPORTES DE MOROSIDAD Y COBRANZA",
    "reportsDashboard.analysisCategory.financialRatios.title": "RATIOS FINANCIEROS",
    "reportsDashboard.analysisCategory.financialRatios.desc": "INDICADORES CLAVE DE SALUD FINANCIERA",

    // ---------------------------------------------------------
    // COMPLIANCE HISTORY (SUB-MODULO)
    // ---------------------------------------------------------
    "reportsDashboard.compliance.title": "CUMPLIMIENTO NORMATIVO",
    "reportsDashboard.compliance.loading": "CARGANDO DATOS DE CUMPLIMIENTO...",
    "reportsDashboard.compliance.statusPending": "PENDIENTE",
    "reportsDashboard.compliance.statusGenerated": "GENERADO",
    "reportsDashboard.compliance.verifiedBy": "VERIFICADO POR",
    "reportsDashboard.compliance.noActivity": "SIN ACTIVIDAD",
    "reportsDashboard.compliance.noHistory": "SIN HISTORIAL",
    "reportsDashboard.compliance.outdatedRates": "TASAS DESACTUALIZADAS",
    "reportsDashboard.compliance.criticalNotice": "AVISO CRÍTICO:",
    "reportsDashboard.compliance.closeView": "CERRAR VISTA",

    // ---------------------------------------------------------
    // SUPPLIER DASHBOARD (FULL COVERAGE)
    // ---------------------------------------------------------
    "supplierDashboard.title": "DASHBOARD PROVEEDORES",
    "supplierDashboard.subtitle": "ANÁLISIS DE CUENTAS POR PAGAR Y EGRESOS",
    "supplierDashboard.totalPartners": "PROVEEDORES TOTALES",
    "supplierDashboard.capitalOutflow": "FLUJO DE SALIDA DE CAPITAL",
    "supplierDashboard.accountsPayable": "CUENTAS POR PAGAR",
    "supplierDashboard.criticalAP": "AP EN ESTADO CRÍTICO",
    "supplierDashboard.newThisMonth": "{count} NUEVOS ESTE MES",
    "supplierDashboard.avgTicket": "TICKET DE COMPRA PROM.",
    "supplierDashboard.ofExpense": "DEL GASTO TOTAL",
    "supplierDashboard.overdue": "PAGOS VENCIDOS",
    "supplierDashboard.costConcentration": "CONCENTRACIÓN DE COSTOS",
    "supplierDashboard.top10Volume": "TOP 10 PROVEEDORES POR VOLUMEN",
    "supplierDashboard.debtAging": "ANTIGÜEDAD DE DEUDA (AP)",
    "supplierDashboard.pendingDistribution": "DISTRIBUCIÓN DE SALDOS PENDIENTES",
    "supplierDashboard.eliteMapping": "MAPEO ELITE DE PROVEEDORES",
    "supplierDashboard.performanceDetail": "DETALLE DE RENDIMIENTO POR PROVEEDOR",
    "supplierDashboard.ranking": "RANK",
    "supplierDashboard.supplierLegalName": "RAZÓN SOCIAL",
    "supplierDashboard.totalExpense": "FACTURACIÓN TOTAL",
    "supplierDashboard.bills": "DOCUMENTOS",
    "supplierDashboard.impact": "IMPACTO OPERATIVO %",
    "supplierDashboard.unknownSupplier": "PROVEEDOR NO IDENTIFICADO",
    "supplierDashboard.analyzing": "ANALIZANDO CARTERA DE PROVEEDORES...",
    "supplierDashboard.aging.current": "AL CORRIENTE",
    "supplierDashboard.aging.31-60": "31-60 DÍAS",
    "supplierDashboard.aging.61-90": "61-90 DÍAS",
    "supplierDashboard.aging.90+": "90+ DÍAS",

    // ---------------------------------------------------------
    // FINANCIAL DASHBOARD (FULL COVERAGE)
    // ---------------------------------------------------------
    "financialDashboard.title": "DASHBOARD FINANCIERO",
    "financialDashboard.subtitle": "ESTADO INTEGRAL Y VITALIDAD DE LA EMPRESA",
    "financialDashboard.periods.6m": "ÚLTIMOS 6 MESES",
    "financialDashboard.periods.ytd": "AÑO A LA FECHA",
    "financialDashboard.periods.12m": "AÑO COMPLETO",
    "financialDashboard.revenue": "INGRESOS BRUTOS",
    "financialDashboard.operating": "GASTOS OPERATIVOS",
    "financialDashboard.profit": "UTILIDAD NETA",
    "financialDashboard.margin": "MARGEN DE GANANCIA",
    "financialDashboard.incomeVsExpenses": "INGRESOS VS EGRESOS",
    "financialDashboard.monthlyCashFlow": "ANÁLISIS DE FLUJO DE CAJA MENSUAL",
    "financialDashboard.profitTrend": "TENDENCIA DE UTILIDADES",
    "financialDashboard.profitMarginPerformance": "RENDIMIENTO HISTÓRICO DEL MARGEN",
    "financialDashboard.revenueLabel": "VENTAS",
    "financialDashboard.expensesLabel": "COMPRAS",
    "financialDashboard.profitLabel": "UTILIDAD",
    "financialDashboard.monthlyAuditLog": "REGISTRO MENSUAL DE AUDITORÍA",
    "financialDashboard.historicalSync": "SINCRONIZACIÓN DE DATOS HISTÓRICOS",
    "financialDashboard.syncing": "SINCRONIZANDO MÉTRICAS FINANCIERAS...",
    "financialDashboard.export": "EXPORTAR DATOS",
    "financialDashboard.months.jan": "ENERO",
    "financialDashboard.months.feb": "FEBRERO",
    "financialDashboard.months.mar": "MARZO",
    "financialDashboard.months.abr": "ABRIL",
    "financialDashboard.months.may": "MAYO",
    "financialDashboard.months.jun": "JUNIO",
    "financialDashboard.months.jul": "JULIO",
    "financialDashboard.months.ago": "AGOSTO",
    "financialDashboard.months.sep": "SEPTIEMBRE",
    "financialDashboard.months.oct": "OCTUBRE",
    "financialDashboard.months.nov": "NOVIEMBRE",
    "financialDashboard.months.dic": "DICIEMBRE",

    // ---------------------------------------------------------
    // PAYROLL DASHBOARD (NEWLY DISCOVERED)
    // ---------------------------------------------------------
    "payrollDashboard.title": "DASHBOARD DE NÓMINA",
    "payrollDashboard.subtitle": "GESTIÓN DE CAPITAL HUMANO Y COSTOS OPERATIVOS",
    "payrollDashboard.processing": "PROCESANDO NÓMINA...",
    "payrollDashboard.simulationMode": "MODO SIMULACIÓN ACTIVADO",
    "payrollDashboard.syncInProgress": "SINCRONIZACIÓN EN CURSO...",
    "payrollDashboard.humanCapital": "CAPITAL HUMANO",
    "payrollDashboard.activeTokens": "EMPLEADOS ACTIVOS",
    "payrollDashboard.monthlyLiability": "PASIVO MENSUAL NÓMINA",
    "payrollDashboard.avg": "SALARIO PROM.",
    "payrollDashboard.nextCycle": "PRÓXIMO CICLO DE PAGO",
    "payrollDashboard.prev": "CIERRE ANTERIOR",
    "payrollDashboard.projectedAnnualCost": "COSTO ANUAL PROYECTADO",
    "payrollDashboard.plImpact": "IMPACTO EN P&L ESTIMADO",
    "payrollDashboard.operationalDistribution": "DISTRIBUCIÓN OPERATIVA",
    "payrollDashboard.salaryLoadByDept": "CARGA SALARIAL POR DEPARTAMENTO",
    "payrollDashboard.growthVector": "VECTOR DE CRECIMIENTO NÓMINA",
    "payrollDashboard.historicalEvolution": "EVOLUCIÓN HISTÓRICA DE COSTOS",
    "payrollDashboard.payrollCertification": "CERTIFICACIÓN DE NÓMINA",
    "payrollDashboard.auditByCostCenter": "AUDITORÍA INTEGRAL POR CENTRO DE COSTOS",
    "payrollDashboard.department": "DEPARTAMENTO",
    "payrollDashboard.workforce": "TALENTO",
    "payrollDashboard.monthlyCost": "COSTO MENSUAL",
    "payrollDashboard.avgSalary": "SALARIO MEDIO",
    "payrollDashboard.impact": "IMPACTO SOBRE NÓMINA %",
    "payrollDashboard.annualCost": "COSTO ANUALIZADO"
};

const enUpdates = {
    // ---------------------------------------------------------
    // REPORTS DASHBOARD
    // ---------------------------------------------------------
    "reportsDashboard.title": "REPORTS DASHBOARD",
    "reportsDashboard.subtitle": "ACCESS COMPREHENSIVE FINANCIAL STATEMENTS & ANALYSIS",
    "reportsDashboard.new": "NEW",
    "reportsDashboard.generate": "GENERATE REPORTS",
    "reportsDashboard.complianceTitle": "COMPLIANCE CENTER",
    "reportsDashboard.complianceDesc": "FILING STATUS & SECURITY AUDIT",
    "reportsDashboard.footerVersion": "SYSTEM PROTECTED BY IRON CORE v3.0",

    "reportsDashboard.financialCategory.title": "FINANCIAL STATEMENTS",
    "reportsDashboard.financialCategory.description": "CORE DECISION-MAKING REPORTS",
    "reportsDashboard.financialCategory.balanceSheet.title": "BALANCE SHEET",
    "reportsDashboard.financialCategory.balanceSheet.desc": "FULL FINANCIAL POSITION STATEMENT",
    "reportsDashboard.financialCategory.incomeStatement.title": "INCOME STATEMENT",
    "reportsDashboard.financialCategory.incomeStatement.desc": "PROFIT AND LOSS REVIEW",
    "reportsDashboard.financialCategory.cashFlow.title": "CASH FLOW",
    "reportsDashboard.financialCategory.cashFlow.desc": "CASH MOVEMENT ANALYSIS",

    "reportsDashboard.ledgerCategory.title": "PRIMARY BOOKS",
    "reportsDashboard.ledgerCategory.description": "AUDIT LOG & ACCOUNTING RECORDS",
    "reportsDashboard.ledgerCategory.generalLedger.title": "GENERAL LEDGER",
    "reportsDashboard.ledgerCategory.generalLedger.desc": "ACCUMULATED MOVEMENTS BY PERIOD",
    "reportsDashboard.ledgerCategory.trialBalance.title": "TRIAL BALANCE",
    "reportsDashboard.ledgerCategory.trialBalance.desc": "BALANCE & ENTRY VERIFICATION",
    "reportsDashboard.ledgerCategory.accountLedger.title": "ACCOUNT LEDGER",
    "reportsDashboard.ledgerCategory.accountLedger.desc": "DETAILED MOVEMENTS BY ACCOUNT",

    "reportsDashboard.analysisCategory.title": "ANALYSIS & RATIOS",
    "reportsDashboard.analysisCategory.description": "ADVANCED BUSINESS PERFORMANCE METRICS",
    "reportsDashboard.analysisCategory.agingReport.title": "AGING REPORT",
    "reportsDashboard.analysisCategory.agingReport.desc": "OVERDUE & COLLECTION STATUS",
    "reportsDashboard.analysisCategory.financialRatios.title": "FINANCIAL RATIOS",
    "reportsDashboard.analysisCategory.financialRatios.desc": "KEY FINANCIAL HEALTH INDICATORS",

    // ---------------------------------------------------------
    // COMPLIANCE HISTORY
    // ---------------------------------------------------------
    "reportsDashboard.compliance.title": "REGULATORY COMPLIANCE",
    "reportsDashboard.compliance.loading": "LOADING COMPLIANCE DATA...",
    "reportsDashboard.compliance.statusPending": "PENDING",
    "reportsDashboard.compliance.statusGenerated": "GENERATED",
    "reportsDashboard.compliance.verifiedBy": "VERIFIED BY",
    "reportsDashboard.compliance.noActivity": "NO ACTIVITY",
    "reportsDashboard.compliance.noHistory": "NO HISTORY",
    "reportsDashboard.compliance.outdatedRates": "OUTDATED RATES",
    "reportsDashboard.compliance.criticalNotice": "CRITICAL NOTICE:",
    "reportsDashboard.compliance.closeView": "CLOSE VIEW",

    // ---------------------------------------------------------
    // SUPPLIER DASHBOARD
    // ---------------------------------------------------------
    "supplierDashboard.title": "SUPPLIER DASHBOARD",
    "supplierDashboard.subtitle": "ACCOUNTS PAYABLE & EXPENSE ANALYSIS",
    "supplierDashboard.totalPartners": "TOTAL SUPPLIERS",
    "supplierDashboard.capitalOutflow": "CAPITAL OUTFLOW",
    "supplierDashboard.accountsPayable": "ACCOUNTS PAYABLE",
    "supplierDashboard.criticalAP": "CRITICAL AP STATUS",
    "supplierDashboard.newThisMonth": "{count} NEW THIS MONTH",
    "supplierDashboard.avgTicket": "AVG PURCHASE TICKET",
    "supplierDashboard.ofExpense": "OF TOTAL EXPENSE",
    "supplierDashboard.overdue": "OVERDUE PAYMENTS",
    "supplierDashboard.costConcentration": "COST CONCENTRATION",
    "supplierDashboard.top10Volume": "TOP 10 SUPPLIERS BY VOLUME",
    "supplierDashboard.debtAging": "DEBT AGING (AP)",
    "supplierDashboard.pendingDistribution": "OUTSTANDING BALANCE DISTRIBUTION",
    "supplierDashboard.eliteMapping": "SUPPLIER ELITE MAPPING",
    "supplierDashboard.performanceDetail": "PERFORMANCE DETAIL BY SUPPLIER",
    "supplierDashboard.ranking": "RANK",
    "supplierDashboard.supplierLegalName": "LEGAL NAME",
    "supplierDashboard.totalExpense": "TOTAL BILLING",
    "supplierDashboard.bills": "DOCUMENTS",
    "supplierDashboard.impact": "OPERATIONAL IMPACT %",
    "supplierDashboard.unknownSupplier": "UNIDENTIFIED SUPPLIER",
    "supplierDashboard.analyzing": "ANALYZING SUPPLIER PORTFOLIO...",
    "supplierDashboard.aging.current": "CURRENT",
    "supplierDashboard.aging.31-60": "31-60 DAYS",
    "supplierDashboard.aging.61-90": "61-90 DAYS",
    "supplierDashboard.aging.90+": "90+ DAYS",

    // ---------------------------------------------------------
    // FINANCIAL DASHBOARD
    // ---------------------------------------------------------
    "financialDashboard.title": "FINANCIAL DASHBOARD",
    "financialDashboard.subtitle": "COMPREHENSIVE COMPANY STATUS & VITALITY",
    "financialDashboard.periods.6m": "LAST 6 MONTHS",
    "financialDashboard.periods.ytd": "YEAR TO DATE",
    "financialDashboard.periods.12m": "FULL YEAR",
    "financialDashboard.revenue": "GROSS REVENUE",
    "financialDashboard.operating": "OPERATING EXPENSES",
    "financialDashboard.profit": "NET PROFIT",
    "financialDashboard.margin": "PROFIT MARGIN",
    "financialDashboard.incomeVsExpenses": "INCOME VS EXPENSES",
    "financialDashboard.monthlyCashFlow": "MONTHLY CASH FLOW ANALYSIS",
    "financialDashboard.profitTrend": "PROFIT TREND",
    "financialDashboard.profitMarginPerformance": "HISTORICAL MARGIN PERFORMANCE",
    "financialDashboard.revenueLabel": "SALES",
    "financialDashboard.expensesLabel": "PURCHASES",
    "financialDashboard.profitLabel": "PROFIT",
    "financialDashboard.monthlyAuditLog": "MONTHLY AUDIT LOG",
    "financialDashboard.historicalSync": "HISTORICAL DATA SYNC",
    "financialDashboard.syncing": "SYNCING FINANCIAL METRICS...",
    "financialDashboard.export": "EXPORT DATA",
    "financialDashboard.months.jan": "JANUARY",
    "financialDashboard.months.feb": "FEBRUARY",
    "financialDashboard.months.mar": "MARCH",
    "financialDashboard.months.abr": "APRIL",
    "financialDashboard.months.may": "MAY",
    "financialDashboard.months.jun": "JUNE",
    "financialDashboard.months.jul": "JULY",
    "financialDashboard.months.ago": "AUGUST",
    "financialDashboard.months.sep": "SEPTEMBER",
    "financialDashboard.months.oct": "OCTOBER",
    "financialDashboard.months.nov": "NOVEMBER",
    "financialDashboard.months.dic": "DECEMBER",

    // ---------------------------------------------------------
    // PAYROLL DASHBOARD
    // ---------------------------------------------------------
    "payrollDashboard.title": "PAYROLL DASHBOARD",
    "payrollDashboard.subtitle": "HUMAN CAPITAL & OPERATIONAL COST MANAGEMENT",
    "payrollDashboard.processing": "PROCESSING PAYROLL...",
    "payrollDashboard.simulationMode": "SIMULATION MODE ACTIVE",
    "payrollDashboard.syncInProgress": "SYNC IN PROGRESS...",
    "payrollDashboard.humanCapital": "HUMAN CAPITAL",
    "payrollDashboard.activeTokens": "ACTIVE EMPLOYEES",
    "payrollDashboard.monthlyLiability": "MONTHLY PAYROLL LIABILITY",
    "payrollDashboard.avg": "AVG SALARY",
    "payrollDashboard.nextCycle": "NEXT PAYROLL CYCLE",
    "payrollDashboard.prev": "PREVIOUS CLOSE",
    "payrollDashboard.projectedAnnualCost": "PROJECTED ANNUAL COST",
    "payrollDashboard.plImpact": "ESTIMATED P&L IMPACT",
    "payrollDashboard.operationalDistribution": "OPERATIONAL DISTRIBUTION",
    "payrollDashboard.salaryLoadByDept": "SALARY LOAD BY DEPARTMENT",
    "payrollDashboard.growthVector": "PAYROLL GROWTH VECTOR",
    "payrollDashboard.historicalEvolution": "HISTORICAL COST EVOLUTION",
    "payrollDashboard.payrollCertification": "PAYROLL CERTIFICATION",
    "payrollDashboard.auditByCostCenter": "INTEGRAL AUDIT BY COST CENTER",
    "payrollDashboard.department": "DEPARTMENT",
    "payrollDashboard.workforce": "TALENT",
    "payrollDashboard.monthlyCost": "MONTHLY COST",
    "payrollDashboard.avgSalary": "MEAN SALARY",
    "payrollDashboard.impact": "PAYROLL IMPACT %",
    "payrollDashboard.annualCost": "ANNUALIZED COST"
};

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
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);

        Object.assign(json, updates);
        Object.assign(json, aliases);

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with FINAL TOTAL sync.`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates, uppercaseAliasesES);
update(enFile, enUpdates, uppercaseAliasesEN);
