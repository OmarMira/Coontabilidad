import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getBudgetLines,
  getBudgetVarianceAnalysis,
  type BudgetLine,
  type BudgetVarianceAnalysis
} from '@/database/modules/db-budgets';
import { useLocale } from '@/i18n/useLocale';

interface BudgetLinesTableProps {
  budgetId: number;
}

export const BudgetLinesTable: React.FC<BudgetLinesTableProps> = ({ budgetId }) => {
  const { t } = useLocale();
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
    if (Math.abs(variancePercent) < 5) return 'text-slate-400';
    return variancePercent > 0 ? 'text-red-400' : 'text-green-400';
  };

  const getVarianceBgColor = (variancePercent: number): string => {
    if (Math.abs(variancePercent) < 5) return 'bg-slate-800/50';
    return variancePercent > 0 ? 'bg-red-900/10' : 'bg-green-900/10';
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-400">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle>{t('budgets.linesWithVariance')}</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>{t('budgets.noLines')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-950">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400 w-8"></th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400">{t('budgets.account')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400">{t('budgets.account')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.budgetedYTD')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.actualYTD')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.variance')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400">{t('budgets.variancePercent')}</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-400">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lines.map((line) => {
                  const variance = varianceData.find(v => v.account_number === line.account_number);
                  const isExpanded = expandedLines.has(line.id);
                  const hasAlert = variance && Math.abs(variance.ytd_variance_percent) > 10;

                  return (
                    <React.Fragment key={line.id}>
                      {/* Main Row */}
                      <tr
                        className={`hover:bg-slate-800/60 transition-colors ${hasAlert ? 'bg-yellow-900/10' : 'bg-slate-900'
                          }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleExpand(line.id)}
                            className="text-slate-500 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {line.account_number}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {variance?.account_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-200">
                          ${variance ? (variance.ytd_budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-200">
                          ${variance ? (variance.ytd_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${variance ? getVarianceColor(variance.ytd_variance_percent) : 'text-slate-200'}`}>
                          {variance ? (
                            <>
                              {variance.ytd_variance > 0 ? '+' : ''}
                              ${(variance.ytd_variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </>
                          ) : (
                            '$0.00'
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${variance ? getVarianceColor(variance.ytd_variance_percent) : 'text-slate-200'}`}>
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
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-yellow-900/40 text-yellow-300 border border-yellow-800">
                              <AlertTriangle className="h-3 w-3" />
                              {t('budgets.alert')}
                            </span>
                          )}
                          {variance && !hasAlert && Math.abs(variance.ytd_variance_percent) < 5 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-green-900/40 text-green-300 border border-green-800">
                              {t('budgets.onTrack')}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Period Breakdown */}
                      {isExpanded && variance && (
                        <tr>
                          <td colSpan={8} className="py-4 px-8 bg-slate-950">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-300 mb-3">{t('budgets.periodBreakdown')}</h4>
                              <div className="overflow-x-auto border border-slate-800 rounded">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900">
                                      <th className="text-left py-2 px-3 font-medium text-slate-400">{t('budgets.period')}</th>
                                      <th className="text-right py-2 px-3 font-medium text-slate-400">{t('budgets.budgeted')}</th>
                                      <th className="text-right py-2 px-3 font-medium text-slate-400">{t('budgets.actual')}</th>
                                      <th className="text-right py-2 px-3 font-medium text-slate-400">{t('budgets.variance')}</th>
                                      <th className="text-right py-2 px-3 font-medium text-slate-400">{t('budgets.variancePercent')}</th>
                                      <th className="text-center py-2 px-3 font-medium text-slate-400">{t('common.status')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variance.periods.map((period) => (
                                      <tr key={period.period_number} className={`border-b border-slate-800 ${getVarianceBgColor(period.variance_percent)}`}>
                                        <td className="py-2 px-3 text-slate-300">{period.period_name}</td>
                                        <td className="py-2 px-3 text-right text-slate-200">
                                          ${(period.budgeted / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-200">
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
                                            <TrendingDown className="h-4 w-4 text-green-500 mx-auto" />
                                          ) : (
                                            <TrendingUp className="h-4 w-4 text-red-500 mx-auto" />
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
