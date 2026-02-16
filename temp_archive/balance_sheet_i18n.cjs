
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "balanceSheet.title": "Balance General",
    "balanceSheet.matrix": "Financial Health Matrix • Audited Snapshots",
    "balanceSheet.cutoffDate": "Corte al Día",
    "balanceSheet.refresh": "Actualizar",
    "balanceSheet.print": "Imprimir",
    "balanceSheet.download": "Descargar PDF",
    "balanceSheet.structuring": "Estructurando Matrices Financieras...",
    "balanceSheet.error": "Fallo crítico en generación de balance general",
    "balanceSheet.noRecords": "Sin registros en este nodo",
    "balanceSheet.balanced": "ESTRUCTURA BALANCEADA",
    "balanceSheet.unbalanced": "INCONSISTENCIA EN RED",
    "balanceSheet.auditProtocol": "Activos = Pasivos + Capital • Protocolo de Auditoría",
    "balanceSheet.criticalDifference": "Diferencia Crítica",
    "balanceSheet.assets": "Activos / Resources",
    "balanceSheet.totalAssets": "Total Activos Brutos",
    "balanceSheet.integratedSnapshot": "Snapshot Integrado",
    "balanceSheet.liabilities": "Pasivos / Debt",
    "balanceSheet.liabilitiesSum": "Suma de Obligaciones",
    "balanceSheet.equity": "Capital / Equity",
    "balanceSheet.residualCapital": "Capital Residual",
    "balanceSheet.accountingEquation": "Ecuación Contable Final",
    "balanceSheet.liabilitiesEquity": "Pasivos + Patrimonio",
    "balanceSheet.auditReady": "Snapshot Audit Ready"
};

const enUpdates = {
    "balanceSheet.title": "Balance Sheet",
    "balanceSheet.matrix": "Financial Health Matrix • Audited Snapshots",
    "balanceSheet.cutoffDate": "Cutoff Date",
    "balanceSheet.refresh": "Refresh",
    "balanceSheet.print": "Print",
    "balanceSheet.download": "Download PDF",
    "balanceSheet.structuring": "Structuring Financial Matrices...",
    "balanceSheet.error": "Critical failure in balance sheet generation",
    "balanceSheet.noRecords": "No records in this node",
    "balanceSheet.balanced": "BALANCED STRUCTURE",
    "balanceSheet.unbalanced": "NETWORK INCONSISTENCY",
    "balanceSheet.auditProtocol": "Assets = Liabilities + Equity • Audit Protocol",
    "balanceSheet.criticalDifference": "Critical Difference",
    "balanceSheet.assets": "Assets / Resources",
    "balanceSheet.totalAssets": "Total Gross Assets",
    "balanceSheet.integratedSnapshot": "Integrated Snapshot",
    "balanceSheet.liabilities": "Liabilities / Debt",
    "balanceSheet.liabilitiesSum": "Sum of Obligations",
    "balanceSheet.equity": "Capital / Equity",
    "balanceSheet.residualCapital": "Residual Capital",
    "balanceSheet.accountingEquation": "Final Accounting Equation",
    "balanceSheet.liabilitiesEquity": "Liabilities + Equity",
    "balanceSheet.auditReady": "Snapshot Audit Ready"
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
