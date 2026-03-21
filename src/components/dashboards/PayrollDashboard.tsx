import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface PayrollStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  nextPayrollDate: string;
  lastPayrollAmount: number;
}

interface DepartmentData {
  name: string;
  employees: number;
  totalSalary: number;
  averageSalary: number;
}

interface MonthlyPayroll {
  month: string;
  amount: number;
  employees: number;
}

export const PayrollDashboard: React.FC = () => {
  const { t, language } = useLocale();
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    averageSalary: 0,
    nextPayrollDate: '',
    lastPayrollAmount: 0
  });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState<MonthlyPayroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrollData();
  }, [language]);

  const loadPayrollData = () => {
    try {
      setLoading(true);
      const mockStats: PayrollStats = {
        totalEmployees: 25,
        activeEmployees: 23,
        totalPayroll: 125000,
        averageSalary: 5435,
        nextPayrollDate: getNextPayrollDate(),
        lastPayrollAmount: 124500
      };

      const mockDepartments: DepartmentData[] = [
        { name: t('payrollDashboard.department') + ' A', employees: 5, totalSalary: 35000, averageSalary: 7000 },
        { name: t('payrollDashboard.department') + ' B', employees: 8, totalSalary: 40000, averageSalary: 5000 },
        { name: t('payrollDashboard.department') + ' C', employees: 7, totalSalary: 28000, averageSalary: 4000 },
        { name: t('payrollDashboard.department') + ' D', employees: 3, totalSalary: 18000, averageSalary: 6000 },
        { name: t('payrollDashboard.department') + ' E', employees: 2, totalSalary: 14000, averageSalary: 7000 }
      ];

      setStats(mockStats);
      setDepartmentData(mockDepartments);
      setMonthlyPayroll(generateMockMonthlyData());
    } catch (error) {
      logger.error('PayrollDashboard', 'error', 'Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextPayrollDate = (): string => {
    const today = new Date();
    const currentDay = today.getDate();
    const date = currentDay < 15
      ? new Date(today.getFullYear(), today.getMonth(), 15)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US');
  };

  const generateMockMonthlyData = (): MonthlyPayroll[] => {
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

    try {
      const { dbExec } = require('../../database/modules/db-core');
      const res = dbExec(`
        SELECT
          strftime('%Y', pay_date) as yr,
          strftime('%m', pay_date) as mo,
          COALESCE(SUM(total_gross), 0) as amount
        FROM payroll_periods
        WHERE status IN ('closed', 'paid')
        GROUP BY yr, mo
        ORDER BY yr DESC, mo DESC
        LIMIT 12
      `);

      if (res && res[0]?.values?.length > 0) {
        return res[0].values
          .slice()
          .reverse()
          .map((row: any[]) => ({
            month: months[parseInt(row[1]) - 1] ?? row[1],
            amount: row[2] ?? 0,
            employees: stats.activeEmployees
          }));
      }
    } catch {
      // fallback to empty below
    }

    // Sin datos: retorna los Ãºltimos 12 meses con cero (sin aleatorios)
    const currentMonth = new Date().getMonth();
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      return { month: months[monthIndex], amount: 0, employees: 0 };
    });
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
      <div className="w-16 h-16 border-4 border-emerald-600/20 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">{t('payrollDashboard.processing')}</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
            <Activity className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
              {t('payrollDashboard.title')}
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2 uppercase">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('payrollDashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <EliteStatCard title={t('payrollDashboard.humanCapital')} value={stats.totalEmployees.toString()} label={`${stats.activeEmployees} ${t('payrollDashboard.activeTokens')}`} icon={Users} color="blue" />
        <EliteStatCard title={t('payrollDashboard.monthlyLiability')} value={formatCurrency(stats.totalPayroll)} label={`${t('payrollDashboard.avg')}: ${formatCurrency(stats.averageSalary)}`} icon={DollarSign} color="emerald" />
        <EliteStatCard title={t('payrollDashboard.nextCycle')} value={stats.nextPayrollDate} label={`${t('payrollDashboard.prev')}: ${formatCurrency(stats.lastPayrollAmount)}`} icon={Calendar} color="amber" />
        <EliteStatCard title={t('payrollDashboard.projectedAnnualCost')} value={formatCurrency(stats.totalPayroll * 12)} label={t('payrollDashboard.plImpact')} icon={TrendingUp} color="emerald" />
      </div>

      {/* Analysis Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <AnalysisBox title={t('payrollDashboard.operationalDistribution')} subtitle={t('payrollDashboard.salaryLoadByDept')}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="barDept" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                cursor={{ fill: 'rgba(16,185,129,0.03)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
              />
              <Bar dataKey="totalSalary" fill="url(#barDept)" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </AnalysisBox>

        <AnalysisBox title={t('payrollDashboard.growthVector')} subtitle={t('payrollDashboard.historicalEvolution')}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyPayroll}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6, stroke: '#0f172a' }}
                activeDot={{ r: 9, stroke: '#10b981', strokeWidth: 2, fill: '#0f172a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </AnalysisBox>
      </div>

      {/* Detailed Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{t('payrollDashboard.payrollCertification')}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{t('payrollDashboard.auditByCostCenter')}</p>
            </div>
          </div>
          <button className="p-3 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all">
            <Cpu className="w-4 h-4 text-slate-500" />
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                {[t('payrollDashboard.department'), t('payrollDashboard.workforce'), t('payrollDashboard.monthlyCost'), t('payrollDashboard.avgSalary'), t('payrollDashboard.impact'), t('payrollDashboard.annualCost')].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {departmentData.map((dept, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-white leading-none uppercase tracking-tighter">{dept.name}</span>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-300 font-mono italic">{dept.employees} pax</td>
                  <td className="px-8 py-5 text-sm font-mono font-black text-emerald-400">{formatCurrency(dept.totalSalary)}</td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-500">{formatCurrency(dept.averageSalary)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${(dept.totalSalary / stats.totalPayroll * 100) || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 w-10 text-right">{((dept.totalSalary / stats.totalPayroll) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-400 font-mono group-hover/row:text-white transition-colors">{formatCurrency(dept.totalSalary * 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EliteStatCard = ({ title, value, icon: Icon, color, label }: any) => {
  const themes: any = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/10',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
    rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/10',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/10',
    indigo: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl group hover:-translate-y-1 transition-all relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-3 rounded-2xl border ${themes[color]} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-2 font-mono tabular-nums leading-none">{value}</div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-all ${themes[color]}`}></div>
    </div>
  );
};

const AnalysisBox = ({ title, subtitle, children }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none"></div>
    <header className="mb-10 relative z-10">
      <h3 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h3>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{subtitle}</p>
    </header>
    <div className="relative z-10 min-h-[300px] flex items-center justify-center">
      {children}
    </div>
  </div>
);

