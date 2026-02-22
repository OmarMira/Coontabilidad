import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users2
} from 'lucide-react';
import { getCustomers, getInvoices } from '../../database/simple-db';
import { useLocale } from '../../i18n/useLocale';

interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalAR: number;
  overdueAR: number;
}

interface TopCustomer {
  id: number;
  name: string;
  revenue: number;
  invoiceCount: number;
  averageOrder: number;
}

interface ARAgingBucket {
  range: string;
  amount: number;
  count: number;
  color: string;
}

export const CustomerDashboard: React.FC = () => {
  const { t } = useLocale();
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalAR: 0,
    overdueAR: 0
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [arAging, setArAging] = useState<ARAgingBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = () => {
    try {
      setLoading(true);
      const customers = getCustomers();
      const invoices = getInvoices();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newCustomers = customers.filter(c => new Date(c.created_at) >= firstDayOfMonth);
      let totalRevenue = 0;
      let overdueAR = 0;

      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
      unpaidInvoices.forEach(inv => {
        if (inv.due_date && new Date(inv.due_date) < now) {
          overdueAR += inv.total_amount;
        }
      });

      invoices.forEach(inv => totalRevenue += inv.total_amount);
      const totalAR = unpaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

      setStats({
        totalCustomers: customers.length,
        newThisMonth: newCustomers.length,
        totalRevenue,
        averageOrderValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        totalAR,
        overdueAR
      });

      const customerRevenue: Record<number, { name: string; revenue: number; count: number }> = {};
      invoices.forEach(inv => {
        if (!customerRevenue[inv.customer_id]) {
          const customer = customers.find(c => c.id === inv.customer_id);
          customerRevenue[inv.customer_id] = { name: customer?.name || t('customerDashboard.unknownCustomer'), revenue: 0, count: 0 };
        }
        customerRevenue[inv.customer_id].revenue += inv.total_amount;
        customerRevenue[inv.customer_id].count += 1;
      });

      setTopCustomers(Object.entries(customerRevenue)
        .map(([id, data]) => ({
          id: Number(id),
          name: data.name,
          revenue: data.revenue,
          invoiceCount: data.count,
          averageOrder: data.revenue / data.count
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10));

      const aging: ARAgingBucket[] = [
        { range: t('customerDashboard.aging.current'), amount: 0, count: 0, color: '#3b82f6' },
        { range: t('customerDashboard.aging.31-60'), amount: 0, count: 0, color: '#f59e0b' },
        { range: t('customerDashboard.aging.61-90'), amount: 0, count: 0, color: '#ef4444' },
        { range: t('customerDashboard.aging.90+'), amount: 0, count: 0, color: '#7f1d1d' }
      ];

      unpaidInvoices.forEach(inv => {
        if (inv.due_date) {
          const daysOverdue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue <= 30) { aging[0].amount += inv.total_amount; aging[0].count++; }
          else if (daysOverdue <= 60) { aging[1].amount += inv.total_amount; aging[1].count++; }
          else if (daysOverdue <= 90) { aging[2].amount += inv.total_amount; aging[2].count++; }
          else { aging[3].amount += inv.total_amount; aging[3].count++; }
        }
      });
      setArAging(aging);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">{t('customerDashboard.syncing')}</span>
    </div>
  );

  return (
    <div className="elite-page-container pb-20">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg">
            <Users2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('customerDashboard.title')}</h1>
            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('customerDashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <EliteStatCard title={t('customerDashboard.totalPortfolio')} value={stats.totalCustomers.toString()} label={t('customerDashboard.newThisMonth', { count: stats.newThisMonth })} icon={Users} color="blue" />
        <EliteStatCard title={t('customerDashboard.grossRevenue')} value={formatCurrency(stats.totalRevenue)} label={`${t('customerDashboard.avgTicket')}: ${formatCurrency(stats.averageOrderValue)}`} icon={DollarSign} color="emerald" />
        <EliteStatCard title={t('customerDashboard.receivables')} value={formatCurrency(stats.totalAR)} label={`${((stats.totalAR / stats.totalRevenue) * 100).toFixed(1)}% ${t('customerDashboard.ofIncome')}`} icon={Clock} color="amber" />
        <EliteStatCard title={t('customerDashboard.overdueAR')} value={formatCurrency(stats.overdueAR)} label={`${((stats.overdueAR / stats.totalAR) * 100).toFixed(1)}% ${t('customerDashboard.atRisk')}`} icon={TrendingUp} color="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Top Customers Vertical Chart */}
        <AnalysisBox title={t('customerDashboard.portfolioLeaders')} subtitle={t('customerDashboard.top10Volume')}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topCustomers} layout="vertical" margin={{ right: 40, left: 20 }}>
              <defs>
                <linearGradient id="barCustomer" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} fontWeight="900" width={140} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Bar dataKey="revenue" fill="url(#barCustomer)" radius={[0, 8, 8, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </AnalysisBox>

        {/* AR Aging Pie */}
        <AnalysisBox title={t('customerDashboard.debtAging')} subtitle={t('customerDashboard.pendingDistribution')}>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 h-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={arAging}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="amount"
                  stroke="none"
                >
                  {arAging.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4 min-w-[200px]">
              {arAging.map((bucket, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }}></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{bucket.range}</span>
                    </div>
                    <span className="text-[10px] font-black text-white font-mono">{formatCurrency(bucket.amount)}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full opacity-50" style={{ width: `${(bucket.amount / stats.totalAR * 100) || 0}%`, backgroundColor: bucket.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnalysisBox>
      </div>

      {/* Detailed Matrix Mapping */}
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/5 blur-[100px] pointer-events-none"></div>
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-none">{t('customerDashboard.eliteMapping')}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">{t('customerDashboard.performanceDetail')}</p>
            </div>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                {[t('customerDashboard.ranking'), t('customerDashboard.legalName'), t('customerDashboard.totalRevenue'), t('customerDashboard.invoices'), t('customerDashboard.average'), t('customerDashboard.impact')].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {topCustomers.map((customer, idx) => (
                <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-5">
                    <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/row:border-blue-500 group-hover/row:text-white transition-all">{idx + 1}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-none">{customer.name}</span>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1.5 opacity-60">ID: CUX-{customer.id.toString().padStart(4, '0')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono font-black text-emerald-400 group-hover/row:scale-105 transition-transform origin-left">{formatCurrency(customer.revenue)}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-300 font-mono italic">{customer.invoiceCount}</td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-500">{formatCurrency(customer.averageOrder)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" style={{ width: `${(customer.revenue / stats.totalRevenue * 100) || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 w-10 text-right">{((customer.revenue / stats.totalRevenue) * 100).toFixed(1)}%</span>
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

const EliteStatCard = ({ title, value, icon: Icon, color, label }: any) => {
  const themes: any = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/10',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
    rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/10',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/10',
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
        <div className="text-2xl font-black text-white tracking-tight mb-2 font-mono tabular-nums leading-none">{value}</div>
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
      <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
    </header>
    <div className="relative z-10 h-[300px] flex items-center justify-center">
      {children}
    </div>
  </div>
);
