import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBudgetVarianceAnalysis, type BudgetVarianceAnalysis } from '@/database/simple-db';
import { Download, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocale } from '@/i18n/useLocale';

interface BudgetVarianceReportProps {
  budgetId: number;
}

export const BudgetVarianceReport: React.FC<BudgetVarianceReportProps> = ({ budgetId }) => {
  const { t } = useLocale();
  const [varianceData, setVarianceData] = useState<BudgetVarianceAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'OVER_BUDGET' | 'UNDER_BUDGET'>('ALL');

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const loadData = () => {
    try {
      setLoading(true);
      const data = getBudgetVarianceAnalysis(budgetId);
      setVarianceData(data);
    } catch (error) {
      console.error('Error loading variance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = varianceData.filter(item => {
    if (filterType === 'OVER_BUDGET') return item.ytd_variance > 0;
    if (filterType === 'UNDER_BUDGET') return item.ytd_variance < 0;
    return true;
  });

  const totalVariance = filteredData.reduce((acc, item) => acc + item.ytd_variance, 0);

  const exportToCSV = () => {
    const headers = [
      t('budgets.account'),
      t('budgets.account'),
      t('budgets.budgetedYTD'),
      t('budgets.actualYTD'),
      t('budgets.variance'),
      t('budgets.variancePercent')
    ];
    const rows = filteredData.map(item => {
      const row = [
        item.account_number,
        '"' + item.account_name + '"',
        (item.ytd_budget / 100).toFixed(2),
        (item.ytd_actual / 100).toFixed(2),
        (item.ytd_variance / 100).toFixed(2),
        item.ytd_variance_percent.toFixed(2) + '%'
      ];
      return row.join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_varianza_' + budgetId + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Título del reporte
    doc.setFontSize(18);
    doc.text(t('budgets.reports.title'), 14, 22);

    // Fecha de generación
    doc.setFontSize(11);
    doc.setTextColor(100);
    const date = new Date().toLocaleDateString(t('common.localeCode') === 'es' ? 'es-ES' : 'en-US');
    doc.text(t('budgets.reports.generated') + ' ' + date, 14, 30);

    // Resumen
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(t('budgets.reports.totalVariance') + ' $' + (totalVariance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }), 14, 40);

    // Tabla de datos
    const tableColumn = [
      t('budgets.account'),
      t('accounting.accountName'),
      t('budgets.budgeted'),
      t('budgets.actual'),
      t('budgets.variance'),
      "%"
    ];
    const tableRowsBuffer: any[] = [];

    filteredData.forEach(item => {
      const budgetData = [
        item.account_number,
        item.account_name,
        '$' + (item.ytd_budget / 100).toFixed(2),
        '$' + (item.ytd_actual / 100).toFixed(2),
        '$' + (item.ytd_variance / 100).toFixed(2),
        item.ytd_variance_percent.toFixed(1) + '%'
      ];
      tableRowsBuffer.push(budgetData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRowsBuffer,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save('reporte_varianza_' + budgetId + '.pdf');
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="py-12 text-center text-slate-400">
          {t('common.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>{t('budgets.reports.title')}</CardTitle>
          <div className="flex gap-2">
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-1">
              <Filter className="h-4 w-4 text-slate-400 ml-2 mr-1" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-transparent border-none text-sm text-white focus:ring-0 cursor-pointer py-1"
              >
                <option value="ALL">{t('common.all')}</option>
                <option value="OVER_BUDGET">{t('budgets.overBudget')}</option>
                <option value="UNDER_BUDGET">{t('budgets.underBudget')}</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm font-medium text-slate-400">{t('budgets.reports.totalVarianceYTD')}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-black tracking-tight ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ${Math.abs(totalVariance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-slate-500">
                {totalVariance > 0 ? t('budgets.overBudget') : t('budgets.underBudget')}
              </span>
            </div>
          </div>
        </div>

        {/* Variance Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-400">{t('budgets.account')}</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400">{t('budgets.account')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.budgeted')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.actual')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.variance')}</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-400">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredData.map((item) => (
                <tr key={item.account_number} className="hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200">{item.account_number}</td>
                  <td className="py-3 px-4 text-slate-300">{item.account_name}</td>
                  <td className="py-3 px-4 text-right text-slate-200">
                    ${(item.ytd_budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-200">
                    ${(item.ytd_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${item.ytd_variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ${(item.ytd_variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${item.ytd_variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {item.ytd_variance_percent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>{t('budgets.reports.noDataWithFilters')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
