import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getBudgetLines,
  getBudgetVarianceAnalysis,
  type BudgetLine,
  type BudgetVarianceAnalysis
} from '@/database/simple-db';

interface BudgetLinesTableProps {
  budgetId: number;
}

export const BudgetLinesTable: React.FC<BudgetLinesTableProps> = ({ budgetId }) => {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [varianceData, setVarianceData] = useState<BudgetVarianceAnalysis[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const loadData = () => {
    try {
      setLoading(true);
      const linesData = getBudgetLines(budgetId);
      const varianceAnalysis = getBudgetVarianceAnalysis(budgetId);
      setLines(linesData);
      setVarianceData(varianceAnalysis);
    } catch (error) {
      console.error('Error loading budget lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (lineId: number) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const getVarianceColor = (variancePercent: number): string => {
    if (Math.abs(variancePercent) < 5) return 'text-gray-700';
    return variancePercent > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getVarianceBgColor = (variancePercent: number): string => {
    if (Math.abs(variancePercent) < 5) return 'bg-gray-50';
    return variancePercent > 0 ? 'bg-red-50' : 'bg-green-50';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando líneas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Líneas de Presupuesto con Análisis de Varianza</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay líneas de presupuesto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-8"></th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Presupuestado</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Real (YTD)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Varianza</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Varianza %</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const variance = varianceData.find(v => v.account_number === line.account_number);
                  const isExpanded = expandedLines.has(line.id);
                  const hasAlert = variance && Math.abs(variance.ytd_variance_percent) > 10;

                  return (
                    <React.Fragment key={line.id}>
                      {/* Main Row */}
                      <tr
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          hasAlert ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleExpand(line.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {line.account_number}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {variance?.account_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          ${(line.annual_amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          ${variance ? (variance.ytd_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${variance ? getVarianceColor(variance.ytd_variance_percent) : 'text-gray-900'}`}>
                          {variance ? (
                            <>
                              {variance.ytd_variance > 0 ? '+' : ''}
                              ${(variance.ytd_variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </>
                          ) : (
                            '$0.00'
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${variance ? getVarianceColor(variance.ytd_variance_percent) : 'text-gray-900'}`}>
                          {variance ? (
                            <>
                              {variance.ytd_variance_percent > 0 ? '+' : ''}
                              {variance.ytd_variance_percent.toFixed(1)}%
                            </>
                          ) : (
                            '0.0%'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasAlert && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3" />
                              Alerta
                            </span>
                          )}
                          {variance && !hasAlert && Math.abs(variance.ytd_variance_percent) < 5 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              En curso
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Period Breakdown */}
                      {isExpanded && variance && (
                        <tr>
                          <td colSpan={8} className="py-4 px-8 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3">Desglose por Período</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-300">
                                      <th className="text-left py-2 px-3 font-medium text-gray-700">Período</th>
                                      <th className="text-right py-2 px-3 font-medium text-gray-700">Presupuestado</th>
                                      <th className="text-right py-2 px-3 font-medium text-gray-700">Real</th>
                                      <th className="text-right py-2 px-3 font-medium text-gray-700">Varianza</th>
                                      <th className="text-right py-2 px-3 font-medium text-gray-700">Varianza %</th>
                                      <th className="text-center py-2 px-3 font-medium text-gray-700">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variance.periods.map((period) => (
                                      <tr key={period.period_number} className={`border-b border-gray-200 ${getVarianceBgColor(period.variance_percent)}`}>
                                        <td className="py-2 px-3 text-gray-700">{period.period_name}</td>
                                        <td className="py-2 px-3 text-right text-gray-900">
                                          ${(period.budgeted / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-right text-gray-900">
                                          ${(period.actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`py-2 px-3 text-right font-medium ${getVarianceColor(period.variance_percent)}`}>
                                          {period.variance > 0 ? '+' : ''}
                                          ${(period.variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`py-2 px-3 text-right font-medium ${getVarianceColor(period.variance_percent)}`}>
                                          {period.variance_percent > 0 ? '+' : ''}
                                          {period.variance_percent.toFixed(1)}%
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {period.is_favorable ? (
                                            <TrendingDown className="h-4 w-4 text-green-600 mx-auto" />
                                          ) : (
                                            <TrendingUp className="h-4 w-4 text-red-600 mx-auto" />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
