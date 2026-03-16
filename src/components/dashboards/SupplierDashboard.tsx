import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Building2,
    DollarSign,
    TrendingDown,
    Clock,
    Award,
    Zap,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    ShieldAlert,
    Maximize2
} from 'lucide-react';
import { getSuppliers } from '@/database/modules/db-suppliers';
import { getBills } from '@/database/modules/db-bills';
import { useLocale } from '../../i18n/useLocale';

interface SupplierStats {
    totalSuppliers: number;
    newThisMonth: number;
    totalExpenses: number;
    averageBillValue: number;
    totalAP: number;
    overdueAP: number;
}

interface TopSupplier {
    id: number;
    name: string;
    expenses: number;
    billCount: number;
    averageBill: number;
}

interface APAgingBucket {
    range: string;
    amount: number;
    count: number;
    color: string;
}

export const SupplierDashboard: React.FC = () => {
    const { t } = useLocale();
    const [stats, setStats] = useState<SupplierStats>({
        totalSuppliers: 0,
        newThisMonth: 0,
        totalExpenses: 0,
        averageBillValue: 0,
        totalAP: 0,
        overdueAP: 0
    });
    const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
    const [apAging, setApAging] = useState<APAgingBucket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSupplierData();
    }, []);

    const loadSupplierData = () => {
        try {
            setLoading(true);
            const suppliers = getSuppliers();
            const bills = getBills();
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const newSuppliers = suppliers.filter(s => new Date(s.created_at ?? Date.now()) >= firstDayOfMonth);
            let totalExpenses = 0;
            let overdueAP = 0;

            const unpaidBills = bills.filter(bill => bill.status !== 'paid' && bill.status !== 'cancelled');
            unpaidBills.forEach(bill => {
                if (bill.due_date && new Date(bill.due_date) < now) {
                    overdueAP += bill.total_amount;
                }
            });

            bills.forEach(bill => totalExpenses += bill.total_amount);
            const totalAP = unpaidBills.reduce((sum, bill) => sum + bill.total_amount, 0);

            setStats({
                totalSuppliers: suppliers.length,
                newThisMonth: newSuppliers.length,
                totalExpenses,
                averageBillValue: bills.length > 0 ? totalExpenses / bills.length : 0,
                totalAP,
                overdueAP
            });

            const supplierExpenses: Record<number, { name: string; expenses: number; count: number }> = {};
            bills.forEach(bill => {
                if (!supplierExpenses[bill.supplier_id]) {
                    const supplier = suppliers.find(s => s.id === bill.supplier_id);
                    supplierExpenses[bill.supplier_id] = { name: supplier?.name || t('supplierDashboard.unknownSupplier'), expenses: 0, count: 0 };
                }
                supplierExpenses[bill.supplier_id].expenses += bill.total_amount;
                supplierExpenses[bill.supplier_id].count++;
            });

            setTopSuppliers(Object.entries(supplierExpenses)
                .map(([id, data]) => ({
                    id: Number(id),
                    name: data.name,
                    expenses: data.expenses,
                    billCount: data.count,
                    averageBill: data.expenses / data.count
                }))
                .sort((a, b) => b.expenses - a.expenses)
                .slice(0, 10));

            const aging: APAgingBucket[] = [
                { range: t('supplierDashboard.aging.current'), amount: 0, count: 0, color: '#3b82f6' },
                { range: t('supplierDashboard.aging.31-60'), amount: 0, count: 0, color: '#f59e0b' },
                { range: t('supplierDashboard.aging.61-90'), amount: 0, count: 0, color: '#ef4444' },
                { range: t('supplierDashboard.aging.90+'), amount: 0, count: 0, color: '#7f1d1d' }
            ];

            unpaidBills.forEach(bill => {
                if (bill.due_date) {
                    const daysOverdue = Math.floor((now.getTime() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysOverdue <= 30) { aging[0].amount += bill.total_amount; aging[0].count++; }
                    else if (daysOverdue <= 60) { aging[1].amount += bill.total_amount; aging[1].count++; }
                    else if (daysOverdue <= 90) { aging[2].amount += bill.total_amount; aging[2].count++; }
                    else { aging[3].amount += bill.total_amount; aging[3].count++; }
                }
            });
            setApAging(aging);
        } catch (error) {
            console.error('Error loading supplier data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-rose-500 rounded-full animate-spin mb-6"></div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">{t('supplierDashboard.analyzing')}</span>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-600/10 rounded-2.5xl border border-rose-500/20 shadow-rose-900/10 shadow-lg group">
                        <Building2 className="w-10 h-10 text-rose-500 group-hover:-rotate-6 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{t('supplierDashboard.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2 uppercase">
                            <Zap className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> {t('supplierDashboard.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <EliteStatCard title={t('supplierDashboard.totalPartners')} value={stats.totalSuppliers.toString()} label={t('supplierDashboard.newThisMonth', { count: stats.newThisMonth })} icon={Building2} color="blue" />
                <EliteStatCard title={t('supplierDashboard.capitalOutflow')} value={formatCurrency(stats.totalExpenses)} label={`${t('supplierDashboard.avgTicket')}: ${formatCurrency(stats.averageBillValue)}`} icon={DollarSign} color="rose" />
                <EliteStatCard title={t('supplierDashboard.accountsPayable')} value={formatCurrency(stats.totalAP)} label={`${((stats.totalAP / stats.totalExpenses) * 100).toFixed(1)}% ${t('supplierDashboard.ofExpense')}`} icon={Clock} color="amber" />
                <EliteStatCard title={t('supplierDashboard.criticalAP')} value={formatCurrency(stats.overdueAP)} label={`${((stats.overdueAP / stats.totalAP) * 100).toFixed(1)}% ${t('supplierDashboard.overdue')}`} icon={TrendingDown} color="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Top Suppliers Vertical Chart */}
                <AnalysisBox title={t('supplierDashboard.costConcentration')} subtitle={t('supplierDashboard.top10Volume')}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={topSuppliers} layout="vertical" margin={{ right: 40, left: 20 }}>
                            <defs>
                                <linearGradient id="barSupplier" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} fontWeight="900" width={140} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(239,68,68,0.02)' }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
                                formatter={(v: any) => formatCurrency(v)}
                            />
                            <Bar dataKey="expenses" fill="url(#barSupplier)" radius={[0, 8, 8, 0]} barSize={26} />
                        </BarChart>
                    </ResponsiveContainer>
                </AnalysisBox>

                {/* AP Aging Pie */}
                <AnalysisBox title={t('supplierDashboard.debtAging')} subtitle={t('supplierDashboard.pendingDistribution')}>
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-10 h-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={apAging}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={10}
                                    dataKey="amount"
                                    stroke="none"
                                >
                                    {apAging.map((entry, index) => (
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
                            {apAging.map((bucket, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }}></div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{bucket.range}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white font-mono">{formatCurrency(bucket.amount)}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div className="h-full opacity-50" style={{ width: `${(bucket.amount / stats.totalAP * 100) || 0}%`, backgroundColor: bucket.color }}></div>
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
                        <div className="w-10 h-10 bg-rose-600/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                            <Target className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{t('supplierDashboard.eliteMapping')}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{t('supplierDashboard.performanceDetail')}</p>
                        </div>
                    </div>
                    <button className="p-3 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-600 hover:text-white">
                        <ShieldAlert className="w-4 h-4" />
                    </button>
                </header>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50">
                            <tr>
                                {[t('supplierDashboard.ranking'), t('supplierDashboard.supplierLegalName'), t('supplierDashboard.totalExpense'), t('supplierDashboard.bills'), t('customerDashboard.avgTicket'), t('supplierDashboard.impact')].map(h => (
                                    <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {topSuppliers.map((supplier, idx) => (
                                <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                    <td className="px-8 py-5">
                                        <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/row:border-rose-500 group-hover/row:text-white transition-all">{idx + 1}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white leading-none">{supplier.name}</span>
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1.5 opacity-60">ID: SPX-{supplier.id.toString().padStart(4, '0')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-mono font-black text-rose-400 group-hover/row:scale-105 transition-transform origin-left">{formatCurrency(supplier.expenses)}</td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-300 font-mono italic">{supplier.billCount}</td>
                                    <td className="px-8 py-5 text-sm font-mono text-slate-500">{formatCurrency(supplier.averageBill)}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                                <div className="h-full bg-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" style={{ width: `${(supplier.expenses / stats.totalExpenses * 100) || 0}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 w-10 text-right">{((supplier.expenses / stats.totalExpenses) * 100).toFixed(1)}%</span>
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
        rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/10',
        emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
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
            <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        </header>
        <div className="relative z-10 min-h-[300px] flex items-center justify-center">
            {children}
        </div>
    </div>
);
