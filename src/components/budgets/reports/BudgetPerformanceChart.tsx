import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import {
  getBudgetVarianceAnalysis,
  getBudgetSummary,
  type BudgetVarianceAnalysis
} from '@/database/simple-db';

interface BudgetPerformanceChartProps {
  budgetId: number;
}

export const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ budgetId }) => {
  const [varianceData, setVarianceData] = useState<BudgetVarianceAnalysis[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const loadData = () => {
    try {
      setLoading(true);
      const variance = getBudgetVarianceAnalysis(budgetId);
      const summaryData = getBudgetSummary(budgetId);
      setVarianceData(variance);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gráficos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max value for bar chart scaling
  const maxValue = Math.max(
    ...varianceData.map(v => Math.max(v.ytd_budget, v.ytd_actual))
  );

  return (
    <div className="space-y-6">
      {/* Budget vs Actual Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <CardTitle>Presupuestado vs Real por Cuenta</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {varianceData.map((item) => {
              const budgetPercent = (item.ytd_budget / maxValue) * 100;
              const actualPercent = (item.ytd_actual / maxValue) * 100;
              const isOver = item.ytd_actual > item.ytd_budget;

              return (
                <div key={item.account_number} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      {item.account_number} - {item.account_name}
                    </span>
                    <span className="text-gray-600">
                      ${(item.ytd_actual / 100).toLocaleString()} / ${(item.ytd_budget / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Budget bar (background) */}
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-200 transition-all"
                      style={{ width: `${budgetPercent}%` }}
                    />
                    {/* Actual bar (foreground) */}
                    <div
                      className={`absolute top-0 left-0 h-full transition-all ${
                        isOver ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${actualPercent}%` }}
                    />
                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-white">
                      <span>Presup: ${(item.ytd_budget / 100).toFixed(0)}</span>
                      <span>Real: ${(item.ytd_actual / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span className="text-gray-700">Presupuestado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Real (Bajo presupuesto)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-700">Real (Sobre presupuesto)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Distribution */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <CardTitle>Distribución del Presupuesto</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Over Budget */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#fee2e2"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#ef4444"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(summary.lines_over_budget / summary.lines_count) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-600">
                      {summary.lines_over_budget}
                    </span>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">Sobre Presupuesto</p>
                <p className="text-sm text-gray-600">
                  {((summary.lines_over_budget / summary.lines_count) * 100).toFixed(1)}% del total
                </p>
              </div>

              {/* Under Budget */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#dcfce7"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#22c55e"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(summary.lines_under_budget / summary.lines_count) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">
                      {summary.lines_under_budget}
                    </span>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">Bajo Presupuesto</p>
                <p className="text-sm text-gray-600">
                  {((summary.lines_under_budget / summary.lines_count) * 100).toFixed(1)}% del total
                </p>
              </div>

              {/* On Budget */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#6b7280"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(summary.lines_on_budget / summary.lines_count) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {summary.lines_on_budget}
                    </span>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">En Presupuesto</p>
                <p className="text-sm text-gray-600">
                  {((summary.lines_on_budget / summary.lines_count) * 100).toFixed(1)}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note about charts */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los gráficos mostrados son visualizaciones básicas. Para gráficos interactivos avanzados, 
            se puede integrar una librería como Chart.js o Recharts en una futura actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
