
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    // LLAVES CRÍTICAS REQUERIDAS POR EMERGENCIA
    // Reportes de Cumplimiento
    "dashboard.startFiscalCycle": "INICIAR CICLO FISCAL",
    "dashboard.complianceRadar": "RADAR DE CUMPLIMIENTO",
    "dashboard.coreHash": "HASH NÚCLEO",
    "dashboard.sunbizReport": "REPORTE ANUAL SUNBIZ",
    "dashboard.daysRemaining": "DÍAS RESTANTES",
    "dashboard.nextDeadline": "PRÓXIMO VENCIMIENTO",
    "reportsDashboard.compliance.title": "CUMPLIMIENTO NORMATIVO",

    // Inventory
    "inventoryDashboard.replenishmentProtocol": "PROTOCOLO DE REABASTECIMIENTO",
    "inventoryDashboard.imminentOutageAlert": "ALERTA DE DESABASTECIMIENTO INMINENTE EN {count} ITEMS",
    "inventoryDashboard.generatePurchaseOrders": "GENERAR ÓRDENES DE COMPRA",
    "inventoryDashboard.valuationCertification": "CERTIFICACIÓN DE VALORACIÓN",
    "inventoryDashboard.abcInventory": "ANÁLISIS DE INVENTARIO ABC",

    // Customer
    "customerDashboard.eliteMapping": "MAPEO ELITE",
    "customerDashboard.performanceDetail": "DETALLE DE RENDIMIENTO",
    "customerDashboard.ranking": "RANGO",
    "customerDashboard.legalName": "RAZÓN SOCIAL",
    "customerDashboard.totalRevenue": "INGRESOS TOTALES",
    "customerDashboard.invoices": "FACTURAS",
    "customerDashboard.average": "PROMEDIO",
    "customerDashboard.impact": "IMPACTO",
    "customerDashboard.portfolioLeaders": "LÍDERES DEL PORTAFOLIO",
    "customerDashboard.top10Volume": "TOP 10 POR VOLUMEN",
    "customerDashboard.debtAging": "ANTIGÜEDAD DE DEUDA",
    "customerDashboard.pendingDistribution": "DISTRIBUCIÓN PENDIENTE",

    // Misc
    "dashboard.sales": "VENTAS",
    "dashboard.purchases": "COMPRAS",
    "dashboard.netProfit": "GANANCIA NETA",
    "dashboard.taxLiability": "PASIVO FISCAL",
    "dashboard.pendingDocs": "DOCS PENDIENTES",
    "dashboard.customerPortfolio": "CARTERA DE CLIENTES"
};

const enUpdates = {
    // CRITICAL KEYS REQUIRED FOR EMERGENCY
    // Compliance Reports
    "dashboard.startFiscalCycle": "START FISCAL CYCLE",
    "dashboard.complianceRadar": "COMPLIANCE RADAR",
    "dashboard.coreHash": "CORE HASH",
    "dashboard.sunbizReport": "SUNBIZ ANNUAL REPORT",
    "dashboard.daysRemaining": "DAYS REMAINING",
    "dashboard.nextDeadline": "NEXT DEADLINE",
    "reportsDashboard.compliance.title": "REGULATORY COMPLIANCE",

    // Inventory
    "inventoryDashboard.replenishmentProtocol": "REPLENISHMENT PROTOCOL",
    "inventoryDashboard.imminentOutageAlert": "IMMINENT OUTAGE ALERT ON {count} ITEMS",
    "inventoryDashboard.generatePurchaseOrders": "GENERATE PURCHASE ORDERS",
    "inventoryDashboard.valuationCertification": "VALUATION CERTIFICATION",
    "inventoryDashboard.abcInventory": "ABC INVENTORY ANALYSIS",

    // Customer
    "customerDashboard.eliteMapping": "ELITE MAPPING",
    "customerDashboard.performanceDetail": "PERFORMANCE DETAIL",
    "customerDashboard.ranking": "RANK",
    "customerDashboard.legalName": "LEGAL NAME",
    "customerDashboard.totalRevenue": "TOTAL REVENUE",
    "customerDashboard.invoices": "INVOICES",
    "customerDashboard.average": "AVERAGE",
    "customerDashboard.impact": "IMPACT",
    "customerDashboard.portfolioLeaders": "PORTFOLIO LEADERS",
    "customerDashboard.top10Volume": "TOP 10 BY VOLUME",
    "customerDashboard.debtAging": "DEBT AGING",
    "customerDashboard.pendingDistribution": "PENDING DISTRIBUTION",

    // Misc
    "dashboard.sales": "SALES",
    "dashboard.purchases": "PURCHASES",
    "dashboard.netProfit": "NET PROFIT",
    "dashboard.taxLiability": "TAX LIABILITY",
    "dashboard.pendingDocs": "PENDING DOCS",
    "dashboard.customerPortfolio": "CUSTOMER PORTFOLIO"
};

function update(file, updates) {
    try {
        let json = JSON.parse(fs.readFileSync(file, 'utf8'));

        // Remove nesting if keys are already dot notation in updates.
        // Actually, the user asked to "Flatten JSON" or ensure flat structure usage.
        // The current files use "key.subkey" as top level keys. We should maintain that.

        for (const [key, value] of Object.entries(updates)) {
            // Force update or add
            json[key] = value;
        }

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with emergency keys.`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);
