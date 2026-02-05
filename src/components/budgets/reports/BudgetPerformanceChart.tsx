import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getBudgetVarianceAnalysis, getBudgetSummary } from '@/database/simple-db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BudgetPerformanceChartProps {
  budgetId: number;
}

export const BudgetPerformanceChart: React.FC<BudgetPerformanceChartProps> = ({ budgetId }) => {
  const data = useMemo(() => {
    try {
      const variance = getBudgetVarianceAnalysis(budgetId);
      const summary = getBudgetSummary(budgetId);
      return { variance, summary };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return { variance: [], summary: null };
    }
  }, [budgetId]);

  // Prepare data for bar chart (Budget vs Actual per Account)
  // Limit to top 10 accounts by amount for readability
  const barChartData = data.variance
    .sort((a, b) => b.ytd_budget - a.ytd_budget)
    .slice(0, 10)
    .map(item => ({
      name: item.account_name.substring(0, 15) + '...',
      Presupuestado: item.ytd_budget / 100,
      Real: item.ytd_actual / 100,
    }));

  // Prepare data for pie chart (Status Distribution)
  const pieChartData = [
    { name: 'En Presupuesto', value: data.summary?.lines_on_budget || 0, color: '#10B981' }, // green-500
    { name: 'Bajo Presupuesto', value: data.summary?.lines_under_budget || 0, color: '#3B82F6' }, // blue-500
    { name: 'Sobre Presupuesto', value: data.summary?.lines_over_budget || 0, color: '#EF4444' }, // red-500
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Presupuesto vs Real (Top 10 Cuentas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar dataKey="Presupuestado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Real" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Estado de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400">No hay datos suficientes para mostrar</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
