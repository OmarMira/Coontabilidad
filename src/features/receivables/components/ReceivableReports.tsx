import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, Clock, Filter, Printer, Download, Zap } from 'lucide-react';
import { getInvoices, Invoice, getCustomers, Customer } from '@/database/simple-db';
import { useLocale } from '../../../i18n/useLocale';

export const ReceivableReports: React.FC = () => {
    const { t, formatCurrency } = useLocale();
    const [loading, setLoading] = useState(false);
    const [receivables, setReceivables] = useState<any[]>([]);

    useEffect(() => {
        const invoices = getInvoices();
        const customers = getCustomers();

        // Calculate aging
        const now = new Date();
        const pending = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');

        const reportData = customers.map(customer => {
            const customerInvoices = pending.filter(inv => inv.customer_id === customer.id);
            const totalDue = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

            const aging = {
                current: 0,
                days30: 0,
                days60: 0,
                days90plus: 0
            };

            customerInvoices.forEach(inv => {
                const dueDate = new Date(inv.due_date || inv.issue_date);
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) aging.current += inv.total_amount || 0;
                else if (diffDays <= 30) aging.days30 += inv.total_amount || 0;
                else if (diffDays <= 60) aging.days60 += inv.total_amount || 0;
                else aging.days90plus += inv.total_amount || 0;
            });

            return {
                ...customer,
                totalDue,
                aging
            };
        }).filter(c => c.totalDue > 0);

        setReceivables(reportData);
    }, []);

    return (
        <div className="elite-page-container">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
                        <TrendingUp className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('receivableReports.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('receivableReports.subtitle')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 no-print">
                    <button
                        className="flex items-center gap-2 px-6 py-3.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-2xl font-bold text-sm transition-all hover:bg-slate-900 hover:text-white"
                        onClick={() => window.print()}
                    >
                        <Printer className="w-4 h-4" /> {t('receivableReports.print')}
                    </button>
                    <button
                        className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1"
                    >
                        <Download className="w-4 h-4" /> {t('receivableReports.export')}
                    </button>
                </div>
            </div>

            <div className="elite-grid-stats">
                <StatCard title={t('receivableReports.totalReceivable')} value={formatCurrency(receivables.reduce((s, r) => s + r.totalDue, 0))} icon={DollarSign} color="blue" />
                <StatCard title={t('receivableReports.customersWithDebt')} value={receivables.length.toString()} icon={Users} color="purple" />
                <StatCard title={t('receivableReports.overdue90')} value={formatCurrency(receivables.reduce((s, r) => s + r.aging.days90plus, 0))} icon={Clock} color="rose" />
                <StatCard title={t('receivableReports.collectionsToday')} value={formatCurrency(receivables.reduce((s, r) => s + r.aging.current, 0))} icon={TrendingUp} color="emerald" />
            </div>

            <Card className="card-elite-flat overflow-hidden p-0">
                <div className="bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between py-5 px-8">
                    <h3 className="text-xl font-bold text-white tracking-tight">{t('receivableReports.portfolioDetail')}</h3>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"><Filter className="w-4 h-4" /> {t('receivableReports.filter')}</button>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">{t('receivableReports.table.customer')}</th>
                                    <th className="px-6 py-4 text-right">{t('receivableReports.table.current')}</th>
                                    <th className="px-6 py-4 text-right">{t('receivableReports.table.days1_30')}</th>
                                    <th className="px-6 py-4 text-right">{t('receivableReports.table.days31_60')}</th>
                                    <th className="px-6 py-4 text-right">{t('receivableReports.table.days61_plus')}</th>
                                    <th className="px-6 py-4 text-right">{t('receivableReports.table.totalDebt')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {receivables.map((data, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-standard-body font-bold text-white">{data.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{data.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">{formatCurrency(data.aging.current)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-amber-400 font-bold">{formatCurrency(data.aging.days30)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-orange-500 font-bold">{formatCurrency(data.aging.days60)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-500 font-bold">{formatCurrency(data.aging.days90plus)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-white text-lg font-black">{formatCurrency(data.totalDue)}</td>
                                    </tr>
                                ))}
                                {receivables.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                                            {t('receivableReports.table.empty')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorMap: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };

    return (
        <Card className="card-elite-flat">
            <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1.5">{title}</div>
                </div>
            </CardContent>
        </Card>
    );
};
