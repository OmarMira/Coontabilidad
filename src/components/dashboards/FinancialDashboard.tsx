import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Maximize2
} from 'lucide-react';
import { getMonthlyFinancialSummary } from '@/database/modules/db-payroll';
import { Button } from '../ui/button';
import { useLocale } from '../../i18n/useLocale';

export const FinancialDashboard: React.FC = () => {
  const { t } = useLocale();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'ytd'>('12m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = () => {
    try {
      setLoading(true);
      const data = getMonthlyFinancialSummary();
      const formattedData = data.map(item => ({
        month: getMonthName(item.month),
        ingresos: item.revenue,
        gastos: item.expenses,
        utilidad: item.revenue - item.expenses,
        margen: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue * 100).toFixed(1) : 0
      }));

      let filteredData = formattedData;
      if (selectedPeriod === '6m') filteredData = formattedData.slice(-6);
      else if (selectedPeriod === 'ytd') filteredData = formattedData.slice(0, new Date().getMonth() + 1);

      setMonthlyData(filteredData);
    } catch (error) {
      logger.error('FinancialDashboard', 'error', 'Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum: string): string => {
    const months = [
      t('financialDashboard.months.jan'),
      t('financialDashboard.months.feb'),
      t('financialDashboard.months.mar'),
      t('financialDashboard.months.abr'),
      t('financialDashboard.months.may'),
      t('financialDashboard.months.jun'),
      t('financialDashboard.months.jul'),
      t('financialDashboard.months.ago'),
      t('financialDashboard.months.sep'),
      t('financialDashboard.months.oct'),
      t('financialDashboard.months.nov'),
      t('financialDashboard.months.dic')
    ];
    return months[parseInt(monthNum) - 1] || monthNum;
  };

  const calculateKPIs = () => {
    if (monthlyData.length < 2) return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, revenueChange: 0, expenseChange: 0, profitChange: 0 };
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.ingresos, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.gastos, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    const revenueChange = previousMonth.ingresos > 0 ? ((currentMonth.ingresos - previousMonth.ingresos) / previousMonth.ingresos * 100) : 0;
    const expenseChange = previousMonth.gastos > 0 ? ((currentMonth.gastos - previousMonth.gastos) / previousMonth.gastos * 100) : 0;
    const profitChange = previousMonth.utilidad > 0 ? ((currentMonth.utilidad - previousMonth.utilidad) / previousMonth.utilidad * 100) : 0;
    return { totalRevenue, totalExpenses, netProfit, profitMargin, revenueChange, expenseChange, profitChange };
  };

  const kpis = calculateKPIs();
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
        <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">{t('financialDashboard.syncing')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight leading-none uppercase">
            <Activity className="w-8 h-8 text-indigo-500" />
            {t('financialDashboard.title')}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2 uppercase">
            <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> {t('financialDashboard.subtitle')}
          </p>
        </div>

        {/* Control Hub */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-1.5 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
            {(['6m', 'ytd', '12m'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${selectedPeriod === period
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {t(`financialDashboard.periods.${period}`)}
              </button>
            ))}
          </div>
          <Button variant="outline" className="h-10 w-10 rounded-xl border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </Button>
          <Button className="h-10 px-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[9px] gap-2">
            <Download className="w-3.5 h-3.5" /> {t('financialDashboard.export')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <PremiumKPICard title={t('financialDashboard.revenue')} value={formatCurrency(kpis.totalRevenue)} change={kpis.revenueChange} icon={DollarSign} color="blue" />
        <PremiumKPICard title={t('financialDashboard.operating')} value={formatCurrency(kpis.totalExpenses)} change={kpis.expenseChange} icon={TrendingDown} color="rose" inverse />
        <PremiumKPICard title={t('financialDashboard.profit')} value={formatCurrency(kpis.netProfit)} change={kpis.profitChange} icon={TrendingUp} color="emerald" />
        <PremiumKPICard title={t('financialDashboard.margin')} value={`${kpis.profitMargin.toFixed(1)}%`} change={kpis.profitChange} icon={PieChartIcon} color="amber" />
      </div>

      {/* Main Analysis Hub */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <AnalysisBox title={t('financialDashboard.incomeVsExpenses')} subtitle={t('financialDashboard.monthlyCashFlow')}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="barExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
              />
              <Bar dataKey="ingresos" fill="url(#barRev)" name={t('financialDashboard.revenueLabel')} radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="gastos" fill="url(#barExp)" name={t('financialDashboard.expensesLabel')} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </AnalysisBox>

        <AnalysisBox title={t('financialDashboard.profitTrend')} subtitle={t('financialDashboard.profitMarginPerformance')}>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="areaUtil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
              />
              <Area type="monotone" dataKey="utilidad" stroke="#10b981" strokeWidth={4} fill="url(#areaUtil)" name={t('financialDashboard.profitLabel')} />
            </AreaChart>
          </ResponsiveContainer>
        </AnalysisBox>
      </div>

      {/* Summary Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/5 blur-[100px] pointer-events-none"></div>
        <header className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">{t('financialDashboard.monthlyAuditLog')}</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{t('financialDashboard.historicalSync')}</p>
          </div>
          <button className="p-3 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
            <Maximize2 className="w-4 h-4 text-slate-500" />
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                {[t('financialDashboard.months.jan'), t('financialDashboard.revenueLabel'), t('financialDashboard.expensesLabel'), t('financialDashboard.profitLabel'), t('financialDashboard.margin') + ' %'].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {monthlyData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-5 text-sm font-black text-white">{row.month}</td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-400">${row.ingresos.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-400">${row.gastos.toLocaleString()}</td>
                  <td className={`px-8 py-5 text-sm font-black font-mono ${row.utilidad >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(row.utilidad)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-all duration-1000" style={{ width: `${Math.max(0, row.margen)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 w-10">{row.margen}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PremiumKPICard = ({ title, value, change, icon: Icon, color, inverse }: any) => {
  const isPositive = change >= 0;
  const isGood = inverse ? !isPositive : isPositive;

  const themes: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-900/10',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-900/10',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/10',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-900/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-white/10 transition-all duration-700"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className={`p-4 rounded-2.5xl border ${themes[color]} group-hover:scale-110 transition-transform duration-500`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase ${isGood ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">{title}</span>
          <div className="text-3xl font-bold text-white tracking-tight font-mono tabular-nums leading-none mb-4">{value}</div>
          <div className="w-full h-1 bg-slate-950 rounded-full border border-slate-800">
            <div className={`h-full rounded-full ${isGood ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisBox = ({ title, subtitle, children }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none"></div>
    <header className="mb-10 relative z-10">
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </header>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);
