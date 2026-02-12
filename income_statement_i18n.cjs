
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "incomeStatement.title": "Estado de Resultados",
    "incomeStatement.performance": "Performance & Ledger Analysis • Final Report",
    "incomeStatement.monthCutoff": "Corte de Mes",
    "incomeStatement.refresh": "Actualizar",
    "incomeStatement.print": "Imprimir",
    "incomeStatement.export": "Export Protocol",
    "incomeStatement.syncRevenue": "Sincronizando Ingresos...",
    "incomeStatement.syncExpenses": "Sincronizando Gastos...",
    "incomeStatement.noRevenue": "Sin registros de entrada",
    "incomeStatement.noExpenses": "Sin registros de egreso",
    "incomeStatement.revenue": "Entradas / Ingresos",
    "incomeStatement.totalRevenue": "Total Ingresos Brutos",
    "incomeStatement.auditPeriod": "Período de Auditoría Vigente",
    "incomeStatement.expenses": "Salidas / Gastos",
    "incomeStatement.totalExpenses": "Total Gastos Operativos",
    "incomeStatement.resourceConsumption": "Consumo Operativo de Recursos",
    "incomeStatement.managementResult": "Resultado de la Gestión",
    "incomeStatement.netProfit": "Utilidad Neta del Ejercicio",
    "incomeStatement.netLoss": "Pérdida Neta del Ejercicio",
    "incomeStatement.cashFlowRealized": "Flujo de Caja Realizado • Protocolo",
    "incomeStatement.pdfHeader": "ESTADO DE RESULTADOS • P&L PROTOCOL",
    "incomeStatement.fiscalCutoff": "Corte Fiscal: {month} {year}",
    "incomeStatement.reportId": "ID Reporte: {id}",
    "incomeStatement.pdfRevenue": "Ingresos Operativos",
    "incomeStatement.pdfExpenses": "Egresos / Gastos",
    "incomeStatement.pdfNetIncome": "UTILIDAD NETA DISPONIBLE:"
};

const enUpdates = {
    "incomeStatement.title": "Income Statement",
    "incomeStatement.performance": "Performance & Ledger Analysis • Final Report",
    "incomeStatement.monthCutoff": "Month Cutoff",
    "incomeStatement.refresh": "Refresh",
    "incomeStatement.print": "Print",
    "incomeStatement.export": "Export Protocol",
    "incomeStatement.syncRevenue": "Syncing Revenue...",
    "incomeStatement.syncExpenses": "Syncing Expenses...",
    "incomeStatement.noRevenue": "No revenue records",
    "incomeStatement.noExpenses": "No expense records",
    "incomeStatement.revenue": "Inflows / Revenue",
    "incomeStatement.totalRevenue": "Total Gross Revenue",
    "incomeStatement.auditPeriod": "Current Audit Period",
    "incomeStatement.expenses": "Outflows / Expenses",
    "incomeStatement.totalExpenses": "Total Operating Expenses",
    "incomeStatement.resourceConsumption": "Operating Resource Consumption",
    "incomeStatement.managementResult": "Management Result",
    "incomeStatement.netProfit": "Net Profit for the Period",
    "incomeStatement.netLoss": "Net Loss for the Period",
    "incomeStatement.cashFlowRealized": "Realized Cash Flow • Protocol",
    "incomeStatement.pdfHeader": "INCOME STATEMENT • P&L PROTOCOL",
    "incomeStatement.fiscalCutoff": "Fiscal Cutoff: {month} {year}",
    "incomeStatement.reportId": "Report ID: {id}",
    "incomeStatement.pdfRevenue": "Operating Revenue",
    "incomeStatement.pdfExpenses": "Outlays / Expenses",
    "incomeStatement.pdfNetIncome": "NET INCOME AVAILABLE:"
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
