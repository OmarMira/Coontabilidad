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
  }, []);

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
        { name: 'ADMINISTRACIÓN', employees: 5, totalSalary: 35000, averageSalary: 7000 },
        { name: 'VENTAS', employees: 8, totalSalary: 40000, averageSalary: 5000 },
        { name: 'OPERACIONES', employees: 7, totalSalary: 28000, averageSalary: 4000 },
        { name: 'IT', employees: 3, totalSalary: 18000, averageSalary: 6000 },
        { name: 'CONTABILIDAD', employees: 2, totalSalary: 14000, averageSalary: 7000 }
      ];

      setStats(mockStats);
      setDepartmentData(mockDepartments);
      setMonthlyPayroll(generateMockMonthlyData());
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextPayrollDate = (): string => {
    const today = new Date();
    const currentDay = today.getDate();
    return currentDay < 15
      ? new Date(today.getFullYear(), today.getMonth(), 15).toLocaleDateString('es-ES')
      : new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('es-ES');
  };

  const generateMockMonthlyData = (): MonthlyPayroll[] => {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const currentMonth = new Date().getMonth();
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      return {
        month: months[monthIndex],
        amount: 115000 + Math.random() * 15000,
        employees: 22 + Math.floor(Math.random() * 4)
      };
    });
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
      <div className="w-16 h-16 border-4 border-emerald-600/20 border-t-emerald-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Processing Human Capital...</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg group">
            <Fingerprint className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Nómina Neuronal</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Human Resources Intelligence Core
            </p>
          </div>
        </div>

        {/* Demo Alert Hub */}
        <div className="px-6 py-4 bg-slate-900 border border-emerald-500/20 rounded-2xl flex items-center gap-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <AlertCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Modo de Simulación Activo</p>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-1 leading-none">Sincronización con PayrollProcessor en proceso...</p>
          </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <EliteStatCard title="Capital Humano" value={stats.totalEmployees.toString()} label={`${stats.activeEmployees} Tokens Activos`} icon={Users} color="blue" />
        <EliteStatCard title="Pasivo Mensual" value={formatCurrency(stats.totalPayroll)} label={`Prom: ${formatCurrency(stats.averageSalary)}`} icon={DollarSign} color="emerald" />
        <EliteStatCard title="Siguiente Ciclo" value={stats.nextPayrollDate} label={`Prev: ${formatCurrency(stats.lastPayrollAmount)}`} icon={Calendar} color="amber" />
        <EliteStatCard title="Costo Anual Proyectado" value={formatCurrency(stats.totalPayroll * 12)} label="Impacto en P&L 12m" icon={TrendingUp} color="emerald" />
      </div>

      {/* Analysis Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <AnalysisBox title="Distribución Operativa" subtitle="Carga salarial por departamento funcional">
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

        <AnalysisBox title="Vector de Crecimiento" subtitle="Evolución histórica del pasivo laboral">
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
              <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Certificación de Nómina</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Auditoría por centro de costo y eficiencia operativa</p>
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
                {['Departamento', 'Fza Laboral', 'Costo Mensual', 'Salario Med', 'Impacto', 'Costo Anual'].map(h => (
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
        <div className="text-4xl font-black text-white tracking-tighter mb-2 font-mono tabular-nums leading-none">{value}</div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
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
