import json
import os

path_en = 'src/locales/en.json'
path_es = 'src/locales/es.json'

def load_json(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(p, data):
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def ensure_dict(d, key):
    if key not in d or not isinstance(d[key], dict):
        d[key] = {}

es_income_statement = {
      "title": "Estado de Resultados",
      "subtitle": "Resultado financiero para el período seleccionado",
      "performance": "Rendimiento Operativo",
      "monthCutoff": "Mes de Corte Fiscal",
      "print": "Imprimir",
      "export": "Exportar PDF",
      "revenue": "Ingresos / Ventas",
      "expenses": "Gastos / Costos",
      "syncRevenue": "Sincronizando ingresos...",
      "syncExpenses": "Sincronizando gastos...",
      "noRevenue": "No se registraron ingresos",
      "noExpenses": "No se registraron gastos",
      "totalRevenue": "Total Ingresos",
      "totalExpenses": "Total Gastos",
      "auditPeriod": "Período Auditado",
      "resourceConsumption": "Consumo de Recursos",
      "managementResult": "Resultado de Gestión",
      "netProfit": "Utilidad Neta",
      "netLoss": "Pérdida Neta",
      "cashFlowRealized": "Flujo Realizado",
      "pdfHeader": "REPORTE FINANCIERO INTEGRADO",
      "fiscalCutoff": "CORTE: {{month}} {{year}}",
      "reportId": "ID REPORTE: {{id}}",
      "pdfCode": "CÓDIGO",
      "pdfAccount": "CUENTA",
      "pdfAmount": "MONTO",
      "pdfTotal": "TOTAL",
      "pdfRevenue": "INGRESOS",
      "pdfExpenses": "GASTOS",
      "pdfNetIncome": "UTILIDAD / RESULTADO NETA"
}

en_income_statement = {
      "title": "Income Statement",
      "subtitle": "Financial result for selected period",
      "performance": "Operating Performance",
      "monthCutoff": "Fiscal Cutoff Month",
      "print": "Print",
      "export": "Export PDF",
      "revenue": "Revenue / Sales",
      "expenses": "Expenses / Costs",
      "syncRevenue": "Syncing revenue...",
      "syncExpenses": "Syncing expenses...",
      "noRevenue": "No revenue recorded",
      "noExpenses": "No expenses recorded",
      "totalRevenue": "Total Revenue",
      "totalExpenses": "Total Expenses",
      "auditPeriod": "Audited Period",
      "resourceConsumption": "Resource Consumption",
      "managementResult": "Management Result",
      "netProfit": "Net Profit",
      "netLoss": "Net Loss",
      "cashFlowRealized": "Realized Cash Flow",
      "pdfHeader": "INTEGRATED FINANCIAL REPORT",
      "fiscalCutoff": "CUTOFF: {{month}} {{year}}",
      "reportId": "REPORT ID: {{id}}",
      "pdfCode": "CODE",
      "pdfAccount": "ACCOUNT",
      "pdfAmount": "AMOUNT",
      "pdfTotal": "TOTAL",
      "pdfRevenue": "REVENUE",
      "pdfExpenses": "EXPENSES",
      "pdfNetIncome": "NET INCOME / PROFIT"
}

print("Restoring incomeStatement...")

try:
    en = load_json(path_en)
    es = load_json(path_es)
except Exception as e:
    print(f"Error loading JSON: {e}")
    exit(1)

ensure_dict(en, "accounting")
ensure_dict(es, "accounting")

# Always overwrite or insert
en["accounting"]["incomeStatement"] = en_income_statement
es["accounting"]["incomeStatement"] = es_income_statement

save_json(path_en, en)
save_json(path_es, es)
print("Restored incomeStatement.")
