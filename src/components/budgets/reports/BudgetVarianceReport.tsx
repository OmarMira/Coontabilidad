import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import {
  getBudgetVarianceAnalysis,
  generateBudgetAlerts,
  type BudgetVarianceAnalysis
} from '@/database/simple-db';

interface BudgetVarianceReportProps {
  budgetId: number;
}

export const BudgetVarianceReport: React.FC<BudgetVarianceReportProps> = ({ budgetId }) => {
  const [varianceData, setVarianceData] = useState<BudgetVarianceAnalysis[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'over' | 'under' | 'alerts'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const loadData = () => {
    try {
      setLoading(true);
      const variance = getBudgetVarianceAnalysis(budgetId);
      const alertsData = generateBudgetAlerts(budgetId);
      setVarianceData(variance);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading variance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = varianceData.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'over') return item.ytd_variance > 0;
    if (filterType === 'under') return item.ytd_variance < 0;
    if (filterType === 'alerts') {
      return alerts.some(alert => alert.account_number === item.account_number);
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Cuenta', 'Nombre', 'Presupuesto Anual', 'Presupuesto YTD', 'Real YTD', 'Varianza', 'Varianza %'];
    const rows = filteredData.map(item => [
      item.account_number,
      item.account_name,
      (item.annual_budget / 100).toFixed(2),
      (item.ytd_budget / 100).toFixed(2),
      (item.ytd_actual / 100).toFixed(2),
      (item.ytd_variance / 100).toFixed(2),
      item.ytd_variance_percent.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_variance_report_${budgetId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totals = filteredData.reduce(
    (acc, item) => ({
      budgeted: acc.budgeted + item.ytd_budget,
      actual: acc.actual + item.ytd_actual,
      variance: acc.variance + item.ytd_variance
    }),
    { budgeted: 0, actual: 0, variance: 0 }
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generando reporte...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reporte de Análisis de Varianza</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filterType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({varianceData.length})
            </button>
            <button
              onClick={() => setFilterType('over')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filterType === 'over'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sobre Presupuesto ({varianceData.filter(v => v.ytd_variance > 0).length})
            </button>
            <button
              onClick={() => setFilterType('under')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filterType === 'under'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bajo Presupuesto ({varianceData.filter(v => v.ytd_variance < 0).length})
            </button>
            <button
              onClick={() => setFilterType('alerts')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filterType === 'alerts'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Con Alertas ({alerts.length})
            </button>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-900">Total Presupuestado (YTD)</p>
            <p className="text-2xl font-bold text-blue-900">
              ${(totals.budgeted / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Total Real (YTD)</p>
            <p className="text-2xl font-bold text-blue-900">
              ${(totals.actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Varianza Total</p>
            <p className={`text-2xl font-bold ${totals.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totals.variance > 0 ? '+' : ''}
              ${(totals.variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Variance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Presup. Anual</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Presup. YTD</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Real YTD</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Varianza</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Varianza %</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const hasAlert = alerts.some(alert => alert.account_number === item.account_number);
                return (
                  <tr
                    key={item.account_number}
                    className={`border-b border-gray-100 ${hasAlert ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{item.account_number}</td>
                    <td className="py-3 px-4 text-gray-700">{item.account_name}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${(item.annual_budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${(item.ytd_budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${(item.ytd_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${item.ytd_variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.ytd_variance > 0 ? '+' : ''}
                      ${(item.ytd_variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${item.ytd_variance_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.ytd_variance_percent > 0 ? '+' : ''}
                      {item.ytd_variance_percent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay datos para mostrar con los filtros seleccionados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
